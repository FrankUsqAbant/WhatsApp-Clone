"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { insforge, getAuthClient } from '@/lib/insforge';
import SplitLayout from '@/components/layout/SplitLayout';
import SidebarHeader from '@/components/layout/SidebarHeader';
import SidebarSearch from '@/components/layout/SidebarSearch';
import { User } from 'lucide-react';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';

export default function Home() {
  const [session, setSession] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isContactsView, setIsContactsView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [contactError, setContactError] = useState('');
  const router = useRouter();

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data: { user } }) => {
      if (user) {
        const accessToken = insforge.auth?.tokenManager?.getAccessToken?.() ||
                            insforge.auth?.tokenManager?.accessToken ||
                            null;
        const sess = { user, access_token: accessToken };
        setSession(sess);
        // Load the user's own profile for the avatar
        insforge.database.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
          .then(({ data }) => { if (data) setMyProfile(data); });
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });
  }, [router]);

  const loadChats = async () => {
    if (!session) return;
    const authDb = getAuthClient(session.access_token);
    
    // Step 1: Get all chat_ids this user is in
    const { data: myParticipations } = await authDb.database
      .from('chat_participants')
      .select('chat_id')
      .eq('profile_id', session.user.id);
      
    if (!myParticipations || myParticipations.length === 0) {
      setChats(prev => prev.filter(c => c.id && !c.lastMessage));
      return;
    }

    const chatIds = myParticipations.map(p => p.chat_id);

    // Step 2: Get chat metadata separately
    const { data: chatsData } = await authDb.database
      .from('chats')
      .select('id, is_group, group_name, group_avatar, created_at')
      .in('id', chatIds);

    if (!chatsData) return;

    // Step 3: Get ALL participants of those chats (flat query, no self-join)
    const { data: allParticipants } = await authDb.database
      .from('chat_participants')
      .select('chat_id, profile_id')
      .in('chat_id', chatIds);

    // Step 4: Get profiles for those participants
    const allProfileIds = [...new Set((allParticipants || []).map(p => p.profile_id))];
    const { data: profiles } = await authDb.database
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .in('id', allProfileIds);

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    // Step 5: Get last message per chat
    const { data: allMessages } = await authDb.database
      .from('messages')
      .select('id, chat_id, content, created_at')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: false });

    const lastMsgMap = {};
    (allMessages || []).forEach(msg => {
      if (!lastMsgMap[msg.chat_id]) lastMsgMap[msg.chat_id] = msg;
    });

    const formattedChats = chatsData.map(chat => {
      const participants = (allParticipants || []).filter(p => p.chat_id === chat.id);
      const otherParticipantId = participants.find(p => p.profile_id !== session.user.id)?.profile_id;
      const otherProfile = otherParticipantId ? profileMap[otherParticipantId] : null;
      const lastMsg = lastMsgMap[chat.id];

      return {
        id: chat.id,
        name: chat.is_group ? chat.group_name : (otherProfile?.full_name || otherProfile?.email || 'Desconocido'),
        avatar: chat.is_group ? chat.group_avatar : otherProfile?.avatar_url,
        lastMessage: lastMsg?.content || '',
        lastMessageTime: lastMsg?.created_at || chat.created_at,
        time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
        unreadCount: 0,
        otherParticipantId: otherParticipantId
      };
    });

    formattedChats.sort((a, b) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    setChats(formattedChats);
  };


  const loadContacts = async () => {
    if (!session) return;
    const authDb = getAuthClient(session.access_token);
    const { data } = await authDb.database
      .from('contacts')
      .select('contact_id, saved_name, profiles!contact_id(email, full_name, avatar_url)')
      .eq('user_id', session.user.id);
      
    if (data) {
      const formattedContacts = data.map(c => ({
        id: c.contact_id,
        full_name: c.saved_name || c.profiles?.full_name,
        email: c.profiles?.email,
        avatar_url: c.profiles?.avatar_url,
      }));
      setContacts(formattedContacts);
    }
  };

  useEffect(() => {
    if (session) {
      loadChats();
      loadContacts();
      
      const authDb = getAuthClient(session.access_token);
      
      // Polling para mantener los chats y el último mensaje actualizados, cada 5 segundos para evitar límites de API
      const interval = setInterval(() => {
        loadChats();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleStartChat = async (contactId) => {
    // Check if chat already exists
    const existingChat = chats.find(c => c.otherParticipantId === contactId && !c.is_group);
    if (existingChat) {
      setActiveChatId(existingChat.id);
      setIsContactsView(false);
      return;
    }

    // Create new chat optimistically
    const newChatId = crypto.randomUUID();
    const contactProfile = contacts.find(c => c.id === contactId);
    const newChatObj = {
      id: newChatId,
      name: contactProfile?.full_name || contactProfile?.email || 'Desconocido',
      avatar: contactProfile?.avatar_url,
      lastMessage: '',
      time: '',
      unreadCount: 0,
      otherParticipantId: contactId
    };
    
    // Update UI instantly
    setChats(prev => [newChatObj, ...prev]);
    setActiveChatId(newChatId);
    setIsContactsView(false);

    // Perform DB operations in background
    try {
      const authDb = getAuthClient(session.access_token);
      const { error: chatError } = await authDb.database.from('chats').insert([{ id: newChatId, is_group: false }]);
      if (chatError) throw chatError;

      const { error: partError } = await authDb.database.from('chat_participants').insert([
        { chat_id: newChatId, profile_id: session.user.id },
        { chat_id: newChatId, profile_id: contactId }
      ]);
      if (partError) throw partError;
      
      // Load chats immediately after successful insert
      loadChats();
    } catch (err) {
      console.error("Error creating chat:", err);
      // Revert optimistic UI on error
      setChats(prev => prev.filter(c => c.id !== newChatId));
      setActiveChatId(null);
      alert("No se pudo iniciar el chat.");
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    setContactError('');
    if (!newContactEmail.trim()) return;
    const authDb = getAuthClient(session.access_token);

    // Search for profile
    const { data: profiles, error: searchError } = await authDb.database
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', newContactEmail.trim().toLowerCase())
      .limit(1);

    if (searchError) {
      setContactError(`Error de red o base de datos: ${searchError.message}`);
      return;
    }

    if (!profiles || profiles.length === 0) {
      setContactError('No se encontró ningún usuario con ese correo.');
      return;
    }

    const profile = profiles[0];

    if (profile.id === session.user.id) {
      setContactError('No puedes añadirte a ti mismo.');
      return;
    }

    const existing = contacts.find(c => c.id === profile.id);
    if (existing) {
      setContactError('Este usuario ya está en tus contactos.');
      return;
    }

    const { error: insertError } = await authDb.database.from('contacts').insert([{
      user_id: session.user.id,
      contact_id: profile.id,
      saved_name: profile.full_name || profile.email
    }]);

    if (!insertError) {
      setNewContactEmail('');
      loadContacts();
    } else {
      setContactError(`Error de inserción: ${insertError.message}`);
    }
  };

  if (isLoading) return <div suppressHydrationWarning style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)'}}>Cargando...</div>;
  if (!session) return null;

  const activeChat = chats.find(c => c.id === activeChatId);

  const filteredContacts = contacts.filter(c => 
    (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChats = chats.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const leftPanel = (
    <>
      <SidebarHeader 
        avatarUrl={myProfile?.avatar_url} 
        userName={myProfile?.full_name} 
        onNewChat={() => { setIsContactsView(!isContactsView); setSearchTerm(''); }} 
      />
      {isContactsView ? (
        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
          <SidebarSearch placeholder="Buscar contactos..." value={searchTerm} onChange={setSearchTerm} />
          <div style={{padding: '15px', paddingBottom: '0', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)'}}>
            <form onSubmit={handleAddContact} style={{display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '15px'}}>
              <div style={{display: 'flex', gap: '8px'}}>
                <input 
                  type="email" 
                  placeholder="Añadir por email..." 
                  value={newContactEmail} 
                  onChange={(e) => setNewContactEmail(e.target.value)} 
                  style={{flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--bg-search)', color: 'var(--text-primary)', outline: 'none', fontSize: '14.5px'}}
                />
                <button type="submit" style={{padding: '8px 15px', borderRadius: '8px', border: 'none', backgroundColor: '#00a884', color: '#111b21', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'}}>
                  Añadir
                </button>
              </div>
              {contactError && <div style={{color: '#ef5350', fontSize: '13px'}}>{contactError}</div>}
            </form>
          </div>
          <div style={{overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-main)'}}>
            <div style={{padding: '15px', color: 'var(--text-secondary)'}}>Contactos disponibles</div>
            {filteredContacts.map(c => (
              <div 
                key={c.id} 
                onClick={() => handleStartChat(c.id)}
                style={{display: 'flex', alignItems: 'center', padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)'}}
              >
                <div style={{width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', marginRight: '15px', backgroundColor: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {c.avatar_url ? <img src={c.avatar_url.includes('pravatar') ? `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name || c.email)}&background=random` : c.avatar_url} alt={c.full_name} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <User size={24} color="#fff" />}
                </div>
                <div style={{color: 'var(--text-primary)'}}>{c.full_name || c.email}</div>
              </div>
            ))}
            {filteredContacts.length === 0 && (
              <div style={{padding: '15px', color: 'var(--text-secondary)', textAlign: 'center'}}>No se encontraron contactos</div>
            )}
          </div>
        </div>
      ) : (
        <>
          <SidebarSearch placeholder="Buscar un chat..." value={searchTerm} onChange={setSearchTerm} />
          <ChatList 
            chats={filteredChats} 
            activeChatId={activeChatId} 
            onChatSelect={setActiveChatId} 
          />
        </>
      )}
    </>
  );

  const rightPanel = activeChatId ? (activeChat ? <ChatWindow chat={activeChat} session={session} /> : <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'}}>Abriendo chat...</div>) : (
    <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'}}>
      Selecciona un chat para empezar a enviar mensajes
    </div>
  );

  return (
    <SplitLayout leftPanel={leftPanel} rightPanel={rightPanel} />
  );
}
