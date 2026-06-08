"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css';
import { Search, MoreVertical, Smile, Paperclip, Mic, Send, User, CheckCheck, FileText, Download, X, UploadCloud, File } from 'lucide-react';
import { insforge, getAuthClient } from '@/lib/insforge';

export default function ChatWindow({ chat, session }) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  
  useEffect(() => {
    if (!chat) return;

    const fetchMessages = async () => {
      const authDb = getAuthClient(session?.access_token);
      const { data, error } = await authDb.database
        .from('messages')
        .select('id, chat_id, sender_id, content, status, created_at')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      if (data) setMessages(data);
    };

    fetchMessages();
    
    // Polling cada 2.5 segundos para evitar límite de peticiones (429 Too Many Requests)
    const interval = setInterval(fetchMessages, 2500);

    return () => clearInterval(interval);
  }, [chat?.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSendMessage = async (customContent = null) => {
    const textToSend = customContent !== null ? customContent : inputText.trim();
    if (!textToSend && !customContent) return;
    
    if (customContent === null) setInputText("");
    const authDb = getAuthClient(session?.access_token);

    // Optimistic UI update
    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      chat_id: chat.id,
      sender_id: session.user.id,
      content: textToSend,
      status: "sent",
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);

    // Send to DB
    const { error } = await authDb.database
      .from('messages').insert([{
      chat_id: chat.id,
      sender_id: session.user.id,
      content: textToSend
    }]);

    if (error) console.error("Error al enviar mensaje:", error.message, error);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  // --- FILE UPLOAD LOGIC ---
  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    const authDb = getAuthClient(session?.access_token);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      
      // Upload the file - SDK returns { data: { key, url, ... }, error }
      const { data: uploadData, error: uploadError } = await authDb.storage
        .from('chat_attachments')
        .upload(filePath, file);
      
      if (uploadError) throw new Error(uploadError.message || JSON.stringify(uploadError));
      
      // Get public URL - SDK returns string directly from getPublicUrl()
      const publicUrl = uploadData?.url || authDb.storage.from('chat_attachments').getPublicUrl(filePath);
      
      const msgObj = {
        text: '',
        file: {
          url: publicUrl,
          name: file.name,
          type: file.type,
          size: file.size
        }
      };
      
      await handleSendMessage(JSON.stringify(msgObj));
    } catch (err) {
      console.error("Error subiendo archivo:", err);
      alert(`Hubo un error al subir el archivo: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };


  // --- DRAG & DROP HANDLERS ---
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // --- RECORDING LOGIC ---
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new window.File([audioBlob], `Nota de voz.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await handleFileUpload(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = null; // Prevent upload
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
  };

  // --- RENDER MESSAGE CONTENT ---
  const renderMessageContent = (content) => {
    let parsed = null;
    try {
      if (content.startsWith('{')) {
        parsed = JSON.parse(content);
      }
    } catch(e) {}

    if (parsed && parsed.file) {
      const f = parsed.file;
      const isImage = f.type.startsWith('image/');
      const isAudio = f.type.startsWith('audio/');
      
      if (isImage) {
        return (
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <img src={f.url} alt={f.name} className={styles.imagePreview} onClick={() => window.open(f.url, '_blank')} />
            {parsed.text && <div>{parsed.text}</div>}
          </div>
        );
      } else if (isAudio) {
        return (
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <audio controls src={f.url} className={styles.audioPlayer} />
            {parsed.text && <div>{parsed.text}</div>}
          </div>
        );
      } else {
        return (
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <div className={styles.filePreview}>
              <div className={styles.fileIcon}><FileText size={20} /></div>
              <div className={styles.fileDetails}>
                <span className={styles.fileName}>{f.name}</span>
                <span className={styles.fileSize}>{Math.round(f.size / 1024)} KB • {f.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
              </div>
              <button className={styles.downloadButton} onClick={() => window.open(f.url, '_blank')} title="Descargar">
                <Download size={20} />
              </button>
            </div>
            {parsed.text && <div>{parsed.text}</div>}
          </div>
        );
      }
    }
    
    return <div>{content}</div>;
  };

  if (!chat) return null;

  return (
    <div 
      className={styles.container}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragOverlayIcon}>
            <UploadCloud size={40} color="#fff" />
          </div>
          <div>Suelta el archivo aquí para enviarlo</div>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.avatar}>
          {chat.avatar ? (
            <img src={chat.avatar.includes('pravatar') ? `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}&background=random` : chat.avatar} alt={chat.name} />
          ) : (
            <User size={24} />
          )}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.name}>{chat.name}</div>
          <div className={styles.status}>en línea</div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconButton}><Search size={20} /></button>
          <button className={styles.iconButton}><MoreVertical size={20} /></button>
        </div>
      </div>

      <div className={styles.messageArea}>
        {messages.map((msg, index) => {
          const isSent = msg.sender_id === session?.user?.id;
          const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={msg.id || index} className={`${styles.messageRow} ${isSent ? styles.sent : styles.received}`}>
              <div className={`${styles.messageBubble} ${isSent ? styles.sent : styles.received}`}>
                <div className={styles.messageText}>
                  {renderMessageContent(msg.content)}
                </div>
                <div className={styles.messageMeta}>
                  <span className={styles.messageTime}>{time}</span>
                  {isSent && (
                    <CheckCheck size={14} color={msg.status === 'read' ? '#53bdeb' : 'var(--text-secondary)'} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        {isRecording ? (
          <div className={styles.recordingContainer}>
            <div className={styles.recordingDot}></div>
            <div className={styles.recordingTime}>{formatTime(recordingTime)}</div>
            <div className={styles.recordingActions}>
              <button className={`${styles.iconButton} ${styles.cancelRecording}`} onClick={cancelRecording} title="Cancelar"><X size={24} /></button>
              <button className={styles.iconButton} onClick={stopRecording} title="Enviar nota de voz"><Send size={24} color="#00a884" /></button>
            </div>
          </div>
        ) : (
          <>
            <button className={styles.iconButton}><Smile size={24} /></button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{display: 'none'}} 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }} 
            />
            
            <button className={styles.iconButton} onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={24} />
            </button>
            
            <div className={styles.inputBox}>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Escribe un mensaje" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isUploading}
              />
            </div>
            
            {isUploading ? (
              <div className={styles.uploadingIndicator}>
                <div className={styles.recordingDot} style={{animation: 'pulse 1s infinite'}}></div>
                Enviando...
              </div>
            ) : inputText.trim() ? (
              <button className={styles.iconButton} onClick={() => handleSendMessage()}><Send size={24} /></button>
            ) : (
              <button className={styles.iconButton} onClick={startRecording}><Mic size={24} /></button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
