import styles from './SplitLayout.module.css';

export default function SplitLayout({ leftPanel, rightPanel }) {
  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        {leftPanel}
      </div>
      <div className={styles.rightPanel}>
        {rightPanel ? rightPanel : (
          <div className={styles.rightPanelEmpty}>
            <div className={styles.emptyTitle}>WhatsApp para Windows</div>
            <div className={styles.emptySubtitle}>
              Envía y recibe mensajes sin necesidad de tener tu teléfono conectado.
              <br />
              Usa WhatsApp en hasta 4 dispositivos vinculados y 1 teléfono a la vez.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
