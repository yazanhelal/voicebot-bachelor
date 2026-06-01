// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import profileImage from "./assets/1750449301732.jpg";
import voicebotLogo from "./assets/Logo.png";

type Message = {
  role: "user" | "bot";
  content: string;
  createdAt?: string;
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

export default function App(): JSX.Element {
  const [status, setStatus] = useState("Bereit");
  const [isRecording, setIsRecording] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [activeView, setActiveView] = useState("Dashboard");
  const [textInput, setTextInput] = useState("");
  const [isTextSending, setIsTextSending] = useState(false);
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [statsMetric, setStatsMetric] = useState("chats");
  const [editingChatId, setEditingChatId] = useState("");
  const [editingTitle, setEditingTitle] = useState("");

  const [settings, setSettings] = useState(() => {
  const saved = localStorage.getItem("voicebot-settings");

  if (saved) {
    return JSON.parse(saved);
  }

  return {
    mode: "gemini",
    language: "de",
    voiceEnabled: true,
    saveChat: true,
    theme: "dark",
  };
});

useEffect(() => {
  localStorage.setItem("voicebot-settings", JSON.stringify(settings));
}, [settings]);

const isLight = settings.theme === "light";

const textPrimary = isLight ? "#0f172a" : "#ffffff";
const textSecondary = isLight ? "#475569" : "rgba(255,255,255,0.72)";
const cardBorder = isLight
  ? "1px solid rgba(15,23,42,0.10)"
  : "1px solid rgba(255,255,255,0.08)";
const softButtonBg = isLight
  ? "rgba(15,23,42,0.06)"
  : "rgba(255,255,255,0.08)";

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const backendBase =
    import.meta.env.VITE_BACKEND_URL ?? "http://127.0.0.1:5000";

  const loadChats = async () => {
    try {
      const res = await fetch(`${backendBase}/chats`);
      const data = await res.json();

      if (data.success) {
        setChats(data.chats);
        if (data.chats.length > 0 && !activeChatId) {
          setActiveChatId(data.chats[0].id);
        }
      }
    } catch (error) {
      setStatus("Backend nicht erreichbar");
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const activeChat = useMemo(
  () => chats.find((chat) => chat.id === activeChatId),
  [chats, activeChatId]
);

const chatEndRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  chatEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [activeChat?.messages]);

const allMessages = chats.flatMap((chat: any) => chat.messages || []);

const userMessages = allMessages.filter(
  (msg: any) => msg.role === "user"
);

const today = new Date().toLocaleDateString("de-DE");

const messagesToday = allMessages.filter((msg: any) => {
  if (!msg.createdAt) return false;

  return (
    new Date(msg.createdAt).toLocaleDateString("de-DE") === today
  );
});

const monthLabels = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"
];

const availableYears = useMemo(() => {
  const years = new Set<number>();

  chats.forEach((chat: any) => {
    if (chat.createdAt) {
      years.add(new Date(chat.createdAt).getFullYear());
    }

    (chat.messages || []).forEach((msg: any) => {
      if (msg.createdAt) {
        years.add(new Date(msg.createdAt).getFullYear());
      }
    });
  });

  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }

  return Array.from(years).sort((a, b) => b - a);
}, [chats]);

const monthlyStats = useMemo(() => {
  const stats = monthLabels.map((label, index) => ({
    label,
    month: index,
    chats: 0,
    commands: 0,
    requests: 0,
    mic: 0,
  }));

  chats.forEach((chat: any) => {
    if (chat.createdAt) {
      const chatDate = new Date(chat.createdAt);

      if (chatDate.getFullYear() === statsYear) {
        stats[chatDate.getMonth()].chats += 1;
      }
    }

    (chat.messages || []).forEach((msg: any) => {
      if (!msg.createdAt) return;

      const msgDate = new Date(msg.createdAt);
      if (msgDate.getFullYear() !== statsYear) return;

      stats[msgDate.getMonth()].requests += 1;

      if (msg.role === "user") {
        stats[msgDate.getMonth()].commands += 1;
        stats[msgDate.getMonth()].mic += 1;
      }
    });
  });

  return stats;
}, [chats, statsYear]);

const statsSummary = {
  chats: monthlyStats.reduce((sum: number, item: any) => sum + item.chats, 0),
  commands: monthlyStats.reduce((sum: number, item: any) => sum + item.commands, 0),
  requests: monthlyStats.reduce((sum: number, item: any) => sum + item.requests, 0),
  mic: monthlyStats.reduce((sum: number, item: any) => sum + item.mic, 0),
};

const chartCards = [
  {
    key: "chats",
    title: "Anzahl Gespräche",
    value: statsSummary.chats,
    subtitle: "Gespeicherte Chats pro Monat",
  },
  {
    key: "commands",
    title: "Anzahl Sprachbefehle",
    value: statsSummary.commands,
    subtitle: "Erkannte Benutzereingaben",
  },
  {
    key: "requests",
    title: "Gesamtanfragen",
    value: statsSummary.requests,
    subtitle: "Alle User- und Bot-Nachrichten",
  },
  {
    key: "mic",
    title: "Mikrofon benutzt",
    value: statsSummary.mic,
    subtitle: "Aufnahmen über den Voice-Button",
  },
];

const selectedValues = monthlyStats.map((item: any) => item[statsMetric] || 0);
const maxChartValue = Math.max(...selectedValues, 1);
const totalMetricValue = selectedValues.reduce((sum: number, value: number) => sum + value, 0);
const avgMetricValue = Math.round(totalMetricValue / 12);

  const handleNewChat = async () => {
    try {
      const res = await fetch(`${backendBase}/chats`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setChats(data.chats);
        if (data.chatId) {
          setActiveChatId(data.chatId);
        }
        setStatus("Bereit");
      }
    } catch (error) {
      setStatus("Backend nicht erreichbar");
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`${backendBase}/chats/${chatId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setChats(data.chats);
        if (data.chats.length > 0) {
          setActiveChatId(data.chats[0].id);
        }
        setStatus("Bereit");
      }
    } catch (error) {
      setStatus("Fehler beim Löschen");
    }
  };

  const handleRenameChat = async (chatId: string) => {
  const title = editingTitle.trim();

  if (!title) {
    setEditingChatId("");
    setEditingTitle("");
    return;
  }

  try {
    const res = await fetch(`${backendBase}/chats/${chatId}/title`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    const data = await res.json();

    if (data.success) {
      setChats(data.chats);
      setEditingChatId("");
      setEditingTitle("");
      setStatus("Titel geändert");
    } else {
      setStatus("Titel konnte nicht geändert werden");
    }
  } catch (error) {
    setStatus("Backend nicht erreichbar");
  }
};

  const handleClearMessagesInActiveChat = async () => {
    if (!activeChatId) return;

    try {
      const res = await fetch(`${backendBase}/chats/${activeChatId}/clear`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setChats(data.chats);
        setStatus("Bereit");
      }
    } catch (error) {
      setStatus("Fehler beim Leeren");
    }
  };

  const startRecording = async () => {
  try {
    if (isRecording) return;

    if (!activeChatId) {
      await handleNewChat();
      setStatus("Bitte nochmal Mikrofon drücken");
      return;
    }

    setStatus("Aufnahme läuft...");
    setIsRecording(true);
    audioChunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start();
  } catch (error) {
    console.error("Mikrofon Fehler:", error);
    setStatus("Mikrofonzugriff fehlgeschlagen");
    setIsRecording(false);
  }
};

  const stopRecording = async () => {
    try {
      if (!mediaRecorderRef.current || !isRecording || !activeChatId) return;

      setStatus("Verarbeitung läuft...");

      const recorder = mediaRecorderRef.current;

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        formData.append("mode", settings.mode);
        formData.append("language", settings.language);
        formData.append("voiceEnabled", String(settings.voiceEnabled));
        formData.append("saveChat", String(settings.saveChat));

        try {
          const res = await fetch(
            `${backendBase}/voicebot/upload/${activeChatId}`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!res.ok) {
            throw new Error(`Server antwortet mit ${res.status}`);
          }

          const data = await res.json();

          if (data.success) {
            setChats(data.chats);
            setStatus("Fertig");

            if (settings.voiceEnabled && data.response) {
              const utterance = new SpeechSynthesisUtterance(data.response);
              utterance.lang = settings.language === "en" ? "en-US" : "de-DE";
              window.speechSynthesis.speak(utterance);
            }
          } else {
            setStatus("Fehler");
          }
        } catch (error) {
          setStatus("Backend nicht erreichbar");
        } finally {
          setIsRecording(false);
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
        }
      };

      recorder.stop();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      setStatus("Fehler beim Stoppen");
      setIsRecording(false);
    }
  };

const handleSendTextMessage = async () => {
  const message = textInput.trim();

  if (!message || !activeChatId || isTextSending) return;

  setIsTextSending(true);
  setStatus("Text wird verarbeitet...");

  try {
    const res = await fetch(`${backendBase}/chat/text/${activeChatId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        mode: settings.mode,
        language: settings.language,
        voiceEnabled: settings.voiceEnabled,
        saveChat: settings.saveChat,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setChats(data.chats);
      setTextInput("");
      setStatus("Fertig");

    if (settings.voiceEnabled && data.response) {
      const utterance = new SpeechSynthesisUtterance(data.response);
      utterance.lang = settings.language === "en" ? "en-US" : "de-DE";
      window.speechSynthesis.speak(utterance);
  }
  } else {
      setStatus("Fehler beim Text-Chat");
    }
  } catch (error) {
    setStatus("Backend nicht erreichbar");
  } finally {
    setIsTextSending(false);
  }
};
  const menuItems = [
    "Dashboard",
    "Chat",
    "Wissen",
    "Einstellungen",
    "Statistiken",
  ];


  const features = [
    {
      icon: "🎙️",
      title: "Spracherkennung",
      text: "Whisper wandelt gesprochene Sprache in Text um.",
    },
    {
      icon: "💬",
      title: "Natürliche Antworten",
      text: "Antworten können lokal oder über KI-Dienste erzeugt werden.",
    },
    {
      icon: "🧠",
      title: "KI-Logik",
      text: "Die Dialoglogik verarbeitet erkannte Eingaben.",
    },
    {
      icon: "💾",
      title: "Chat-Speicherung",
      text: "Gespräche werden in einer SQLite-Datenbank gespeichert.",
    },
    {
      icon: "🔌",
      title: "API-Erweiterung",
      text: "Das System kann mit externen Diensten erweitert werden.",
    },
  ];

  return (
    <div style={isLight ? styles.pageLight : styles.page}>
      <div style={styles.shell}>
        <aside style={isLight ? styles.sidebarLight : styles.sidebar}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>
              <img
                src={voicebotLogo}
                alt="VoiceBot Logo"
                style={styles.logoImage}
              />
            </div>
            <div>
              <div style={isLight ? styles.logoTitleLight : styles.logoTitle}>VoiceBot</div>
            </div>
          </div>

          <nav style={styles.menu}>
            {menuItems.map((item) => (
              <button
                key={item}
                style={{
                  ...(isLight ? styles.menuItemLight : styles.menuItem),
                  ...(activeView === item
                    ? (isLight ? styles.menuItemActiveLight : styles.menuItemActive)
                    : {}),
                }}
                onClick={() => setActiveView(item)}
              >
                <span>{getMenuIcon(item)}</span>
                {item}
              </button>
            ))}
          </nav>

          <div style={styles.sidebarHistory}>
  <div style={isLight ? styles.sidebarHistoryTitleLight : styles.sidebarHistoryTitle}>Aktuelle</div>

  <div style={styles.sidebarHistoryList} className="sidebar-history-scroll">
    {chats.map((chat) => (
  <div
    key={chat.id}
    style={{
      ...styles.sidebarHistoryRow,
      ...(activeChatId === chat.id ? styles.sidebarHistoryItemActive : {}),
    }}
  >
    {editingChatId === chat.id ? (
      <input
        value={editingTitle}
        autoFocus
        style={styles.sidebarTitleInput}
        onChange={(e) => setEditingTitle(e.target.value)}
        onBlur={() => handleRenameChat(chat.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleRenameChat(chat.id);
          }

          if (e.key === "Escape") {
            setEditingChatId("");
            setEditingTitle("");
          }
        }}
      />
    ) : (
      <button
        style={isLight ? styles.sidebarHistoryItemLight : styles.sidebarHistoryItem}
        onClick={() => {
          setActiveChatId(chat.id);
          setActiveView("Dashboard");
        }}
        onDoubleClick={() => {
          setEditingChatId(chat.id);
          setEditingTitle(chat.title);
        }}
        title="Doppelklick zum Umbenennen"
      >
        {chat.title}
      </button>
    )}

    <button
      style={isLight ? styles.sidebarDeleteButtonLight : styles.sidebarDeleteButton}
      onClick={(e) => {
        e.stopPropagation();
        handleDeleteChat(chat.id);
      }}
      title="Chat löschen"
    >
      ×
    </button>
  </div>
))}
  </div>
</div>

          <div style={styles.userBox}>
            <div style={styles.userAvatar}>
              <img
                src={profileImage}
                alt="1750449301732"
                style={styles.userAvatarImage}
              />
          </div>
            <div>
              <div style={styles.userName}>Yazan Alhelal</div>
              <div style={styles.userRole}>Student</div>
            </div>
          </div>
        </aside>

        <main style={styles.main}>
  <header style={styles.topBar}>
    <div>
      <h1
        style={{
          margin: 0,
          fontSize: "42px",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
          paddingBottom: "6px",
          background: isLight
            ? "none"
            : "linear-gradient(135deg, #ffffff, #93c5fd, #c084fc)",
          WebkitBackgroundClip: isLight ? "initial" : "text",
          color: isLight ? "#2563eb" : "transparent",
          textShadow: isLight
            ? "0 10px 30px rgba(37,99,235,0.25)"
            : "none",
        }}
      >
        Voicebot
      </h1>
    </div>

    <div
      style={{
        ...styles.statusBadge(isRecording),
        background: isLight
          ? "rgba(255,255,255,0.9)"
          : styles.statusBadge(isRecording).background,
        border: isLight
          ? "1px solid rgba(15,23,42,0.12)"
          : styles.statusBadge(isRecording).border,
        color: isLight ? "#0f172a" : "#ffffff",
        boxShadow: isLight
          ? "0 10px 30px rgba(15,23,42,0.12)"
          : "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <span style={styles.onlineDot}></span>
      {status}
    </div>
  </header>

  {activeView === "Verlauf" ? (
    <section style={isLight ? styles.panelLight : styles.historyPage}>
      <div style={styles.historyHeader}>
        <h2 style={{ ...styles.historyTitle, color: textPrimary }}>
          Gespeicherte Unterhaltungen
        </h2>
      </div>

      <div style={styles.historyList}>
        {chats.map((chat) => (
          <div
            key={chat.id}
            style={{
              ...styles.historyItem,
              background: isLight
                ? "rgba(255,255,255,0.78)"
                : "rgba(255,255,255,0.06)",
              border: isLight
                ? "1px solid rgba(15,23,42,0.12)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              style={{
                ...styles.historyOpenButton,
                background: isLight
                  ? "rgba(15,23,42,0.04)"
                  : "rgba(255,255,255,0.05)",
                border: isLight
                  ? "1px solid rgba(15,23,42,0.12)"
                  : "1px solid rgba(255,255,255,0.08)",
                color: textPrimary,
              }}
              onClick={() => {
                setActiveChatId(chat.id);
                setActiveView("Dashboard");
              }}
            >
              <div style={{ ...styles.historyItemTitle, color: textPrimary }}>
                {chat.title}
              </div>
              <div style={{ ...styles.historyItemDate, color: textSecondary }}>
                {new Date(chat.createdAt).toLocaleString("de-DE")}
              </div>
            </button>

            <button
              style={{
                ...styles.historyDeleteButton,
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
              }}
              onClick={() => handleDeleteChat(chat.id)}
            >
              Löschen
            </button>
          </div>
        ))}
      </div>
    </section>
  ) : activeView === "Wissen" ? (
    <section style={isLight ? styles.panelLight : { padding: 32 }}>
      <h2 style={{ fontSize: 32, marginBottom: 16, color: textPrimary }}>Wissen</h2>
       <div style={styles.pageCard}>
    <p style={styles.pageSubtitle}>
      Kurze Übersicht über die wichtigsten Funktionen des Voicebots.
    </p>

    <div style={styles.knowledgeGrid}>
      {[
        
        { icon: "🎙️", title: "Spracheingabe", text: "Über den Mikrofon-Button kann Sprache aufgenommen werden. Die Aufnahme wird lokal mit Whisper in Text umgewandelt." },
        { icon: "💬", title: "Text-Chat", text: "Der Voicebot kann auch ohne Mikrofon verwendet werden. Nachrichten können direkt im Chat eingegeben werden." },
        { icon: "🧠", title: "Antwortmodi", text: "Im Gemini-Modus werden Antworten über die Gemini API erzeugt. Im lokalen Modus wird llama.cpp mit einem GGUF-Modell verwendet." },
        { icon: "🖥️", title: "PC-Integration", text: "Der Voicebot kann einfache Aktionen ausführen, zum Beispiel Chrome, den Datei-Explorer, den Rechner oder die Einstellungen öffnen." },
        { icon: "📁", title: "Dateisuche", text: "Der Voicebot kann lokale Dateien suchen und den Dateipfad anzeigen. Beispiele: „Finde Datei docker-compose.yml“, „Wo ist App.tsx?“ oder „Suche Datei voicebot.db“. Die Dateisuche funktioniert nur im lokalen Modus der nativen Windows-Version." },
        { icon: "🗂️", title: "Chatverwaltung", text: "Chats können gespeichert, geöffnet, gelöscht und umbenannt werden. Neue Chats erhalten automatisch einen passenden Titel." },
        { icon: "📊", title: "Statistiken", text: "Die Statistikseite zeigt Gespräche, Nachrichten, Benutzereingaben, Mikrofonnutzung und monatliche Aktivität." },
        { icon: "🐳", title: "Docker-Version", text: "Frontend, Backend und lokales Sprachmodell können getrennt in Docker-Containern laufen. PC-Integration ist dort eingeschränkt." },

      ].map((item) => (
        <div key={item.title} style={styles.knowledgeCard}>
          <div style={styles.knowledgeIcon}>{item.icon}</div>
          <h3 style={styles.knowledgeTitle}>{item.title}</h3>
          <p style={styles.knowledgeText}>{item.text}</p>
        </div>
      ))}
    </div>
  </div>
    </section>
  ) : activeView === "Einstellungen" ? (
    <section style={isLight ? styles.panelLight : styles.settingsPage}>
      <h2 style={styles.settingsTitle}>Einstellungen</h2>

      <div style={styles.settingsGrid}>
        <div style={isLight ? styles.settingCardLight : styles.settingCard}>
          <h3>Antwortmodus</h3>
          <p>Wähle, ob der Voicebot lokal oder mit Gemini antwortet.</p>

          <div style={styles.segmentRow}>
            <button
              style={{
                ...styles.segmentButton(settings.theme),
                ...(settings.mode === "local"
                  ? styles.segmentButtonActive
                  : {}),
              }}
              onClick={() =>
                setSettings((prev: any) => ({ ...prev, mode: "local" }))
              }
            >
              Lokal
            </button>

            <button
              style={{
                ...styles.segmentButton(settings.theme),
                ...(settings.mode === "gemini"
                  ? styles.segmentButtonActive
                  : {}),
              }}
              onClick={() =>
                setSettings((prev: any) => ({ ...prev, mode: "gemini" }))
              }
            >
              Gemini
            </button>
          </div>
        </div>

        <div style={isLight ? styles.settingCardLight : styles.settingCard}>
          <h3>Sprache</h3>
          <p>Wähle die bevorzugte Sprache für die Antwort.</p>

          <div style={styles.segmentRow}>
            <button
              style={{
                ...styles.segmentButton(settings.theme),
                ...(settings.language === "de"
                  ? styles.segmentButtonActive
                  : {}),
              }}
              onClick={() =>
                setSettings((prev: any) => ({ ...prev, language: "de" }))
              }
            >
              Deutsch
            </button>

            <button
              style={{
                ...styles.segmentButton(settings.theme),
                ...(settings.language === "en"
                  ? styles.segmentButtonActive
                  : {}),
              }}
              onClick={() =>
                setSettings((prev: any) => ({ ...prev, language: "en" }))
              }
            >
              Englisch
            </button>
          </div>
        </div>

        <div style={isLight ? styles.settingCardLight : styles.settingCard}>
          <h3>Sprachausgabe</h3>
          <p>Antworten können zusätzlich vorgelesen werden.</p>

          <button
            style={{
              ...styles.toggleButton(settings.theme),
              ...(settings.voiceEnabled ? styles.toggleButtonOn : {}),
            }}
            onClick={() =>
              setSettings((prev: any) => ({
                ...prev,
                voiceEnabled: !prev.voiceEnabled,
              }))
            }
          >
            {settings.voiceEnabled ? "Aktiviert" : "Deaktiviert"}
          </button>
        </div>

        <div style={isLight ? styles.settingCardLight : styles.settingCard}>
          <h3>Chat speichern</h3>
          <p>Speichert Unterhaltungen lokal in SQLite.</p>

          <button
            style={{
              ...styles.toggleButton(settings.theme),
              ...(settings.saveChat ? styles.toggleButtonOn : {}),
            }}
            onClick={() =>
              setSettings((prev: any) => ({
                ...prev,
                saveChat: !prev.saveChat,
              }))
            }
          >
            {settings.saveChat ? "Aktiviert" : "Deaktiviert"}
          </button>
        </div>

        <div style={isLight ? styles.settingCardLight : styles.settingCard}>
          <h3>Design</h3>
          <p>Wähle das Aussehen der Benutzeroberfläche.</p>

          <div style={styles.segmentRow}>
            <button
              style={{
                ...styles.segmentButton(settings.theme),
                ...(settings.theme === "dark"
                  ? styles.segmentButtonActive
                  : {}),
              }}
              onClick={() =>
                setSettings((prev: any) => ({ ...prev, theme: "dark" }))
              }
            >
              Dunkel
            </button>

            <button
              style={{
                ...styles.segmentButton(settings.theme),
                ...(settings.theme === "light"
                  ? styles.segmentButtonActive
                  : {}),
              }}
              onClick={() =>
                setSettings((prev: any) => ({ ...prev, theme: "light" }))
              }
            >
              Hell
            </button>
          </div>
        </div>
      </div>
    </section>

    ) : activeView === "Chat" ? (
  <section style={isLight ? styles.chatTextPageLight : styles.chatTextPage}>
    <div style={styles.chatTextHeader}>
      <div>
        <h2
          style={{
            ...styles.settingsTitle,
            color: isLight ? "#7c3aed" : "#a78bfa",
          }}
        >
          Text-Chat
        </h2>
        <p
          style={{
            margin: "6px 0 0",
            color: isLight ? "#475569" : "rgba(255,255,255,0.68)",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Schreibe eine Nachricht und erhalte eine Antwort vom Voicebot.
        </p>
      </div>

      <button
        style={{
          ...styles.smallButton,
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          color: "#ffffff",
          border: "none",
        }}
        onClick={handleNewChat}
      >
        + Neuer Chat
      </button>
    </div>

    <div style={styles.chatTextMessages}>
      {(activeChat?.messages ?? []).map((msg, index) => (
        <div
          key={index}
          style={
            msg.role === "user"
              ? styles.textChatUserBubble
              : {
                  ...styles.textChatBotBubble,
                  background: isLight
                    ? "rgba(15,23,42,0.06)"
                    : "rgba(255,255,255,0.07)",
                  border: isLight
                    ? "1px solid rgba(15,23,42,0.12)"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: isLight ? "#0f172a" : "#ffffff",
                }
          }
        >
          {msg.content}
        </div>
      ))}
      <div ref={chatEndRef}></div>
    </div>

    <div
      style={{
        ...styles.textChatInputBox,
        background: isLight ? "rgba(255,255,255,0.9)" : "rgba(15,23,42,0.85)",
        border: isLight
          ? "1px solid rgba(15,23,42,0.12)"
          : "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <input
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSendTextMessage();
          }
        }}
        placeholder="Schreibe eine Nachricht..."
        style={{
          ...styles.textChatInput,
          color: isLight ? "#0f172a" : "#ffffff",
        }}
      />

      <button
        style={{
          ...styles.textChatSendButton,
          opacity: isTextSending ? 0.6 : 1,
        }}
        onClick={handleSendTextMessage}
        disabled={isTextSending}
      >
        {isTextSending ? "..." : "Senden"}
      </button>
    </div>
  </section>
    ) : activeView === "Statistiken" ? (
  <section style={isLight ? styles.panelLight : styles.statsPage}>
    <div style={styles.statsHeaderRow}>
      <div>
        <h2
          style={{
            ...styles.statsTitle,
            color: isLight ? "#7c3aed" : "#a78bfa",
          }}
        >
          Statistiken
        </h2>

        <p
          style={{
            margin: "6px 0 0",
            color: isLight ? "#475569" : "rgba(255,255,255,0.68)",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Monatsübersicht der Nutzung des Voicebots
        </p>
      </div>

      <select
        value={statsYear}
        onChange={(e) => setStatsYear(Number(e.target.value))}
        style={{
          ...styles.statsSelect,
          background: isLight ? "#ffffff" : "rgba(255,255,255,0.08)",
          color: isLight ? "#0f172a" : "#ffffff",
          border: isLight
            ? "1px solid rgba(15,23,42,0.12)"
            : "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {availableYears.map((year: number) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>

    <div style={styles.statsTopCards}>
      <div style={isLight ? styles.statCardLight : styles.statCard}>
        <h3>Anzahl Gespräche</h3>
        <p>{statsSummary.chats}</p>
      </div>

      <div style={isLight ? styles.statCardLight : styles.statCard}>
        <h3>Anzahl Sprachbefehle</h3>
        <p>{statsSummary.commands}</p>
      </div>

      <div style={isLight ? styles.statCardLight : styles.statCard}>
        <h3>Gesamtanfragen</h3>
        <p>{statsSummary.requests}</p>
      </div>

      <div style={isLight ? styles.statCardLight : styles.statCard}>
        <h3>Mikrofon benutzt</h3>
        <p>{statsSummary.mic}x</p>
      </div>
    </div>

    <div style={styles.chartGrid}>
      {chartCards.map((card: any) => (
        <MiniBarChart
          key={card.key}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          data={monthlyStats}
          metricKey={card.key}
          isLight={isLight}
        />
      ))}
    </div>
  </section>
) : (
    <section style={styles.dashboardGrid}>
      <div
  style={
    isLight
      ? {
          ...styles.cardLight,
          minHeight: "800px",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center" as const,
        }
      : styles.heroCard
  }
>
        <div style={styles.heroTop}>
          <div>
            <h2
              style={{
                ...styles.heroTitle,
                color: isLight ? "#334155" : "#ffffff",
              }}
            >
              Hallo, Wie kann ich dir heute helfen?
            </h2>
          </div>
        </div>

        <div style={styles.voiceArea}>
          <div style={styles.waveBars}>
            {[
              24, 52, 78, 44, 92, 60, 34, 70, 48, 88, 38, 64, 100, 56, 30,
              76, 42, 86, 50, 68, 36, 90, 58, 46, 80,
            ].map((height, index) => (
              <span
                key={index}
                style={{
                  ...styles.waveBar,
                  height: `${height}px`,
                }}
              />
            ))}
          </div>

          <div style={styles.waveGlow}></div>

          <button
            type="button"
            style={styles.voiceOrb(isRecording)}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={() => {
              if (isRecording) stopRecording();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              startRecording();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopRecording();
            }}
          >
            <div style={styles.voiceOrbInner}>
              {isRecording ? "◉" : "🎙️"}
            </div>
          </button>

          <p
            style={{
              ...styles.voiceHint,
              color: isLight ? "#475569" : "rgba(255,255,255,0.78)",
            }}
          >
            {isRecording
              ? "Sprich jetzt..."
              : "Klicke auf das Mikrofon oder halte gedrückt"}
          </p>
        </div>
      </div>

      <div
  style={
    isLight
      ? { ...styles.cardLight, minHeight: "800px", display: "flex", flexDirection: "column" as const }
      : styles.currentChatCard
  }
>
        <div style={styles.cardHeader}>
          <h3 style={{ ...styles.cardTitle, color: textPrimary }}>
            Aktueller Chat
          </h3>

          <button
            style={{
              ...styles.smallButton,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "#ffffff",
              border: "none",
              boxShadow: "0 10px 25px rgba(124,58,237,0.25)",
            }}
            onClick={handleNewChat}
          >
            + Neu
          </button>
        </div>

        <div style={styles.miniChatArea}>
          {(activeChat?.messages ?? []).map((msg, index) => (
            <div
              key={index}
              style={
                msg.role === "user"
                  ? styles.miniUserBubble
                  : {
                      ...styles.miniBotBubble,
                      background: isLight
                        ? "rgba(15,23,42,0.06)"
                        : "rgba(255,255,255,0.07)",
                      border: isLight
                        ? "1px solid rgba(15,23,42,0.12)"
                        : "1px solid rgba(255,255,255,0.08)",
                      color: isLight ? "#0f172a" : "#ffffff",
                    }
              }
            >
              {msg.content}
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>

        <button
          style={{
            ...styles.clearButton,
            background: isLight
              ? "rgba(15,23,42,0.06)"
              : "rgba(255,255,255,0.06)",
            color: isLight ? "#0f172a" : "#ffffff",
            border: isLight
              ? "1px solid rgba(15,23,42,0.12)"
              : "1px solid rgba(255,255,255,0.10)",
          }}
          onClick={handleClearMessagesInActiveChat}
        >
          Verlauf leeren
        </button>
      </div>
    </section>
  )}
</main>

      </div>
    </div>
  );
}

function MiniBarChart({
  title,
  value,
  subtitle,
  data,
  metricKey,
  isLight,
}: any) {
  const values = data.map((item: any) => item[metricKey] || 0);
  const maxValue = Math.max(...values, 1);
  const avgValue = Math.round(
    values.reduce((sum: number, val: number) => sum + val, 0) / 12
  );

  return (
    <div
      style={{
        borderRadius: "26px",
        padding: "22px",
        background: isLight
          ? "rgba(255,255,255,0.9)"
          : "rgba(15,23,42,0.72)",
        border: isLight
          ? "1px solid rgba(15,23,42,0.12)"
          : "1px solid rgba(148,163,184,0.16)",
        boxShadow: isLight
          ? "0 18px 45px rgba(15,23,42,0.12)"
          : "0 18px 45px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: isLight ? "#64748b" : "rgba(255,255,255,0.58)",
              marginBottom: "5px",
            }}
          >
            {subtitle}
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 900,
              color: isLight ? "#0f172a" : "#ffffff",
            }}
          >
            {title}
          </h3>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: isLight ? "#2563eb" : "#60a5fa",
              lineHeight: 1,
            }}
          >
            {value}
          </div>
          <div
            style={{
              fontSize: "12px",
              marginTop: "6px",
              color: isLight ? "#64748b" : "rgba(255,255,255,0.58)",
              fontWeight: 700,
            }}
          >
            Ø {avgValue}/Monat
          </div>
        </div>
      </div>

      <div
        style={{
          height: "210px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        {data.map((item: any) => {
          const currentValue = item[metricKey] || 0;
          const height = currentValue > 0
            ? Math.max((currentValue / maxValue) * 100, 12)
            : 6;

          return (
            <div
              key={item.label}
              style={{
                flex: 1,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <div
                style={{
                  height: "160px",
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    width: "18px",
                    height: "100%",
                    borderRadius: "999px",
                    background: isLight
                      ? "rgba(37,99,235,0.08)"
                      : "rgba(255,255,255,0.05)",
                  }}
                />

                <div
                  title={`${item.label}: ${currentValue}`}
                  style={{
                    width: "22px",
                    height: `${height}%`,
                    borderRadius: "999px",
                    background:
                      "linear-gradient(180deg, #38bdf8 0%, #2563eb 55%, #7c3aed 100%)",
                    boxShadow: "0 12px 30px rgba(37,99,235,0.38)",
                    position: "relative",
                    zIndex: 2,
                    transition: "height 0.3s ease",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: isLight ? "#64748b" : "rgba(255,255,255,0.58)",
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 900,
                  color: isLight ? "#0f172a" : "#ffffff",
                  minHeight: "16px",
                }}
              >
                {currentValue}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getMenuIcon(item: string) {
  const icons: Record<string, string> = {
    Dashboard: "⌂",
    Chat: "☰",
    Verlauf: "↺",
    Wissen: "□",
    Einstellungen: "⚙",
    Statistiken: "▥",
  };

  return icons[item] ?? "•";
}

const styles = {
  page: {
  width: "100%",
  height: "100vh",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, rgba(124,58,237,0.28), transparent 35%), radial-gradient(circle at top right, rgba(56,189,248,0.16), transparent 30%), linear-gradient(135deg, #050816 0%, #0b1020 45%, #111827 100%)",
  padding: "18px",
  color: "white",
},

  shell: {
  width: "100%",
  height: "100%",
  display: "grid",
  gridTemplateColumns: "270px 1fr",
  gap: "16px",
},

  sidebar: {
  height: "calc(100vh - 36px)",
  borderRadius: "28px",
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(148,163,184,0.16)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  overflow: "hidden",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
  flexShrink: 0,
  color: "#ffffff",
},

  logoRow: {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "18px 20px",
  borderBottom: "1px solid rgba(148,163,184,0.12)",
},

  logoIcon: {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.08)",
  overflow: "hidden",
  flexShrink: 0,
},

logoImage: {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
  borderRadius: "12px",
},

  logoTitle: {
  margin: 0,
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 900,
  lineHeight: 1.1,
},

  logoTitleLight: {
  margin: 0,
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: 900,
  lineHeight: 1.1,
},

  logoSub: {
  margin: "3px 0 0",
  color: "rgba(255,255,255,0.68)",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.2,
},

  menu: {
    padding: "14px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },

  menuItem: {
    width: "100%",
    border: "none",
    borderRadius: "14px",
    padding: "13px 14px",
    background: "transparent",
    color: "rgba(255,255,255,0.72)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    textAlign: "left" as const,
  },

  menuItemLight: {
    width: "100%",
    border: "none",
    borderRadius: "14px",
    padding: "13px 14px",
    background: "transparent",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    textAlign: "left" as const,
  },

  menuItemActive: {
    width: "100%",
    border: "none",
    background: "rgba(255,255,255,0.14)",
    color: "#ffffff",
    padding: "13px 14px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 800,
    textAlign: "left" as const,
  },

  menuItemActiveLight: {
    width: "100%",
    border: "none",
    background: "rgba(15,23,42,0.10)",
    color: "#0f172a",
    padding: "13px 14px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 800,
    textAlign: "left" as const,
  },

  sidebarChats: {
    padding: "14px",
    borderTop: "1px solid rgba(148,163,184,0.10)",
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column" as const,
  },

  sidebarSmallTitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "10px",
  },

  newChatButton: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "white",
    borderRadius: "16px",
    padding: "13px 16px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 800,
    marginBottom: "12px",
  },

  chatList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "9px",
    overflowY: "auto" as const,
    paddingRight: "4px",
  },

  chatItem: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "8px",
    alignItems: "center",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "8px",
  },

  chatItemActive: {
    background: "rgba(124,58,237,0.24)",
    border: "1px solid rgba(167,139,250,0.28)",
  },

  chatItemButton: {
    border: "none",
    background: "transparent",
    color: "white",
    textAlign: "left" as const,
    cursor: "pointer",
    padding: "4px",
    minWidth: 0,
  },

  chatItemTitle: {
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "4px",
    lineHeight: 1.3,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  chatItemDate: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.55)",
  },

  deleteChatButton: {
    border: "none",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    width: "30px",
    height: "30px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
  },

  userBox: {
    padding: "16px",
    borderTop: "1px solid rgba(148,163,184,0.12)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  userAvatar: {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #38bdf8, #7c3aed)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0,
 },

 userAvatarImage: {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
  borderRadius: "50%",
},

  userName: {
    fontSize: "13px",
    fontWeight: 800,
  },

  userRole: {
    marginTop: "3px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.55)",
  },

  main: {
    minHeight: "92vh",
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
    overflow: "hidden",
    minWidth: 0,
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 4px 20px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "42px",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    paddingBottom: "6px",
    background: "linear-gradient(135deg, #ffffff, #93c5fd, #c084fc)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },

  pageSubtitle: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.58)",
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },

  statusBadge: (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 800,
    background: active ? "rgba(236,72,153,0.18)" : "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "white",
    whiteSpace: "nowrap" as const,
  }),

  onlineDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 18px rgba(34,197,94,0.9)",
  },

  dashboardGrid: {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 680px",
  gap: "20px",
  minWidth: 0,
 },

  heroCard: {
    minHeight: "800px",
    borderRadius: "28px",
    background:
      "radial-gradient(circle at center, rgba(124,58,237,0.16), transparent 55%), rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
    overflow: "hidden",
    padding: "28px",
    position: "relative" as const,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  heroTop: {
    display: "flex",
    justifyContent: "center",
    textAlign: "center" as const,
  },

  heroTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 900,
  },

  heroText: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.62)",
    fontSize: "15px",
  },

  voiceArea: {
    minHeight: "260px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
  },

  waveBars: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "720px",
    height: "150px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    opacity: 0.35,
    zIndex: 1,
    pointerEvents: "none" as const,
  },

  waveBar: {
    width: "5px",
    borderRadius: "999px",
    background: "linear-gradient(180deg, rgba(59,130,246,0.05), rgba(59,130,246,0.7), rgba(59,130,246,0.05))",
    boxShadow: "0 0 18px rgba(59,130,246,0.45)",
  },

  voiceOrb: (active: boolean) => ({
    width: "190px",
    height: "190px",
    borderRadius: "50%",
    border: "6px solid transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(#0b1020, #0b1020) padding-box, linear-gradient(135deg, #38bdf8, #7c3aed, #a855f7) border-box",
    boxShadow: active
      ? "0 0 35px rgba(56,189,248,0.8), 0 0 70px rgba(124,58,237,0.6)"
      : "0 0 28px rgba(56,189,248,0.45), 0 0 55px rgba(124,58,237,0.35)",
    transition: "all 0.2s ease",
    padding: 0,
    position: "relative" as const,
    zIndex: 2,
  }),

  voiceOrbInner: {
    width: "135px",
    height: "135px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(30,41,59,0.9), rgba(15,23,42,0.95))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#c7d2fe",
    fontSize: "58px",
    boxShadow: "inset 0 0 35px rgba(59,130,246,0.25)",
  },

  voiceHint: {
    margin: "28px 0 0",
    color: "rgba(255,255,255,0.78)",
    fontSize: "20px",
    fontWeight: 400,
    position: "relative" as const,
    zIndex: 2,
  },

  suggestionArea: {
  marginTop: "10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
},

  suggestionTitle: {
    color: "rgba(255,255,255,0.70)",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "10px",
  },

  suggestionRow: {
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "10px",
},

  suggestionButton: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.82)",
    borderRadius: "14px",
    padding: "10px 13px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 700,
  },

  currentChatCard: {
    borderRadius: "28px",
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
    padding: "20px",
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "430px",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 900,
  },

  smallButton: {
    border: "none",
    background: "rgba(124,58,237,0.35)",
    color: "white",
    borderRadius: "12px",
    padding: "9px 12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 800,
  },

  miniChatArea: {
    flex: 1,
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
    paddingRight: "3px",
    overflowY: "auto",
    maxHeight: "650px",
    overflowY: "auto",
    scrollBehavior: "smooth",
  },

  miniUserBubble: {
    alignSelf: "flex-end",
    maxWidth: "86%",
    background: "linear-gradient(135deg, #7c3aed, #d946ef)",
    padding: "12px 14px",
    borderRadius: "16px 16px 5px 16px",
    fontSize: "13px",
    lineHeight: 1.45,
  },

  miniBotBubble: {
    alignSelf: "flex-start",
    maxWidth: "86%",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "12px 14px",
    borderRadius: "16px 16px 16px 5px",
    fontSize: "13px",
    lineHeight: 1.45,
  },

  clearButton: {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  borderRadius: "16px",
  padding: "14px",
  fontWeight: 900,
  cursor: "pointer",
},

  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 420px",
    gap: "20px",
  },

  chatPanel: {
    height: "390px",
    borderRadius: "28px",
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.26)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },

  featuresPanel: {
    height: "390px",
    borderRadius: "28px",
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.26)",
    padding: "22px",
    overflow: "hidden",
  },

  panelHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid rgba(148,163,184,0.12)",
  },

  panelTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 900,
    color: "#a78bfa",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },

  fullChatArea: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "18px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
  },

  userRow: {
    display: "flex",
    justifyContent: "flex-end",
  },

  botRow: {
    display: "flex",
    justifyContent: "flex-start",
  },

  userBubble: {
    maxWidth: "78%",
    padding: "14px 16px",
    borderRadius: "20px 20px 6px 20px",
    background: "linear-gradient(135deg, #d946ef, #7c3aed)",
    color: "white",
    lineHeight: 1.45,
    boxShadow: "0 12px 30px rgba(124,58,237,0.35)",
  },

  botBubble: {
    maxWidth: "78%",
    padding: "14px 16px",
    borderRadius: "20px 20px 20px 6px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "white",
    lineHeight: 1.45,
  },

  featureList: {
    marginTop: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },

  featureCard: {
    display: "grid",
    gridTemplateColumns: "46px 1fr",
    gap: "12px",
    alignItems: "center",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "14px",
  },

  featureIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    background: "rgba(124,58,237,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  featureTitle: {
    fontSize: "14px",
    fontWeight: 900,
    marginBottom: "4px",
  },

  featureText: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.62)",
    lineHeight: 1.35,
  },

  historyPage: {
  borderRadius: "28px",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.16)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.26)",
  padding: "28px",
  minHeight: "calc(100vh - 150px)",
  overflowY: "auto" as const,
},

historyHeader: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "22px",
},

historyTitle: {
  margin: 0,
  fontSize: "26px",
  fontWeight: 900,
},

historyList: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "16px",
},

historyItem: {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "12px",
  alignItems: "center",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "16px",
},

historyOpenButton: {
  flex: 1,
  textAlign: "left" as const,
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(15,23,42,0.12)",
  color: "#0f172a",
  borderRadius: "18px",
  padding: "16px",
  cursor: "pointer",
},

historyItemTitle: {
  fontSize: "15px",
  fontWeight: 900,
  color: "#0f172a",
},

historyItemDate: {
  fontSize: "12px",
  color: "#475569",
  marginTop: "4px",
},

historyDeleteButton: {
  background: "#ef4444",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer",
},

statsPage: {
  width: "100%",
  height: "100%",
  borderRadius: "28px",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.16)",
  padding: "30px",
  overflowY: "auto" as const,
},

statsTitle: {
  fontSize: "34px",
  fontWeight: 900,
  marginBottom: "28px",
  color: "#a78bfa",
},

statsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "18px",
},

statCard: {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "22px",
  padding: "26px",
  textAlign: "center" as const,
  boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
},

waveGlow: {
  position: "absolute" as const,
  width: "65%",
  height: "180px",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  background:
    "radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)",
  filter: "blur(30px)",
  zIndex: 0,
},

settingsPage: {
  width: "100%",
  minHeight: "calc(100vh - 120px)",
  borderRadius: "28px",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.16)",
  padding: "30px",
  overflowY: "auto" as const,
},

settingsTitle: {
  margin: "0 0 26px",
  fontSize: "34px",
  fontWeight: 900,
  color: "#a78bfa",
},

settingsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "18px",
},

settingCard: {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
},

segmentRow: {
  display: "flex",
  gap: "10px",
  marginTop: "18px",
},

segmentButton: (theme: "dark" | "light") => ({
  flex: 1,
  border:
    theme === "dark"
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(15,23,42,0.18)",
  background:
    theme === "dark"
      ? "rgba(255,255,255,0.08)"
      : "rgba(15,23,42,0.06)",
  color: theme === "dark" ? "#ffffff" : "#0f172a",
  borderRadius: "16px",
  padding: "13px 14px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 800,
}),

segmentButtonActive: {
  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
  color: "#ffffff",
  border: "1px solid rgba(124,58,237,0.35)",
  boxShadow: "0 12px 30px rgba(124,58,237,0.28)",
},

toggleButton: (theme: "dark" | "light") => ({
  width: "100%",
  marginTop: "18px",
  border:
    theme === "dark"
      ? "1px solid rgba(255,255,255,0.14)"
      : "1px solid rgba(15,23,42,0.18)",
  background:
    theme === "dark"
      ? "rgba(255,255,255,0.08)"
      : "rgba(15,23,42,0.06)",
  color: theme === "dark" ? "#ffffff" : "#0f172a",
  borderRadius: "16px",
  padding: "13px 14px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 900,
}),

toggleButtonOn: {
  background: "linear-gradient(135deg, #16a34a, #2563eb)",
  color: "#ffffff",
  border: "1px solid rgba(37,99,235,0.25)",
  boxShadow: "0 12px 30px rgba(37,99,235,0.25)",
},

pageLight: {
  width: "100%",
  height: "100vh",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 35%), linear-gradient(135deg, #f8fafc 0%, #e0f2fe 45%, #eef2ff 100%)",
  padding: "18px",
  color: "#0f172a",
},

panelLight: {
  width: "100%",
  minHeight: "calc(100vh - 120px)",
  borderRadius: "28px",
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(15,23,42,0.14)",
  padding: "30px",
  overflowY: "auto" as const,
  color: "#0f172a",
  boxShadow: "0 20px 60px rgba(15,23,42,0.16)",
  backdropFilter: "blur(16px)",
},

cardLight: {
  borderRadius: "28px",
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(15,23,42,0.14)",
  boxShadow: "0 20px 60px rgba(15,23,42,0.16)",
  padding: "26px",
  color: "#0f172a",
  backdropFilter: "blur(16px)",
  minHeight: "800px",
  display: "flex",
  flexDirection: "column" as const,
},

settingCardLight: {
  background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(15,23,42,0.12)",
  borderRadius: "24px",
  padding: "24px",
  color: "#0f172a",
  boxShadow: "0 10px 30px rgba(15,23,42,0.10)",
},

statCardLight: {
  background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(15,23,42,0.12)",
  borderRadius: "22px",
  padding: "26px",
  textAlign: "center" as const,
  color: "#0f172a",
  boxShadow: "0 10px 30px rgba(15,23,42,0.10)",
},

sidebarHistory: {
  borderTop: "1px solid rgba(148,163,184,0.10)",
  padding: "14px",
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column" as const,
},

sidebarHistoryTitle: {
  fontSize: "12px",
  color: "rgba(255,255,255,0.50)",
  marginBottom: "10px",
  padding: "0 4px",
  fontWeight: 700,
},

sidebarHistoryList: {
  flex: 1,
  minHeight: 0,
  overflowY: "auto" as const,
  overflowX: "hidden" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
  paddingRight: "4px",
  scrollbarWidth: "thin" as const,
  scrollbarColor: "rgba(148,163,184,0.35) transparent",
},

sidebarHistoryItem: {
  width: "100%",
  height: "34px",
  border: "none",
  background: "transparent",
  color: "rgba(255,255,255,0.82)",
  textAlign: "left" as const,
  cursor: "pointer",
  borderRadius: "10px",
  padding: "8px 10px",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "18px",
  whiteSpace: "nowrap" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "block",
  boxSizing: "border-box" as const,
},

sidebarHistoryItemActive: {
  background: "rgba(255,255,255,0.13)",
  color: "#ffffff",
},

sidebarHistoryRow: {
  width: "100%",
  minHeight: "34px",
  display: "grid",
  gridTemplateColumns: "1fr 26px",
  alignItems: "center",
  gap: "4px",
  borderRadius: "10px",
  padding: "0 4px 0 0",
  background: "transparent",
  boxSizing: "border-box" as const,
},

sidebarDeleteButton: {
  width: "26px",
  height: "26px",
  border: "none",
  borderRadius: "8px",
  background: "transparent",
  color: "rgba(255,255,255,0.55)",
  cursor: "pointer",
  fontSize: "18px",
  fontWeight: 800,
  lineHeight: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},

statsHeaderRow: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "24px",
  flexWrap: "wrap" as const,
},

statsControls: {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
},

statsSelect: {
  borderRadius: "14px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: 700,
  outline: "none",
  cursor: "pointer",
},

bigChartCard: {
  borderRadius: "28px",
  padding: "24px",
  marginBottom: "24px",
  boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
},

bigChartTop: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "24px",
  flexWrap: "wrap" as const,
},

bigChartLabel: {
  fontSize: "13px",
  fontWeight: 700,
  opacity: 0.8,
  marginBottom: "6px",
},

bigChartNumber: {
  fontSize: "30px",
  fontWeight: 900,
},

monthChart: {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "14px",
  minHeight: "280px",
  paddingTop: "10px",
},

monthCol: {
  flex: 1,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: "10px",
},

monthBarWrap: {
  position: "relative" as const,
  width: "34px",
  height: "190px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
},

monthBarTrack: {
  position: "absolute" as const,
  bottom: 0,
  width: "18px",
  height: "100%",
  borderRadius: "999px",
},

monthBar: {
  position: "relative" as const,
  width: "22px",
  borderRadius: "999px",
  background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 55%, #7c3aed 100%)",
  boxShadow: "0 10px 30px rgba(37,99,235,0.35)",
  zIndex: 2,
},

monthLabel: {
  fontSize: "12px",
  fontWeight: 700,
},

monthValue: {
  fontSize: "13px",
  fontWeight: 900,
},

statsHeaderRow: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "24px",
  flexWrap: "wrap" as const,
},

statsSelect: {
  borderRadius: "14px",
  padding: "11px 16px",
  fontSize: "14px",
  fontWeight: 800,
  outline: "none",
  cursor: "pointer",
},

statsTopCards: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "16px",
  marginBottom: "22px",
},

chartGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
  gap: "20px",
},

sidebarTitleInput: {
  width: "100%",
  height: "28px",
  border: "1px solid rgba(124,58,237,0.45)",
  background: "rgba(255,255,255,0.10)",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "0 8px",
  fontSize: "13px",
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box" as const,
},

chatTextPage: {
  width: "100%",
  minHeight: "calc(100vh - 120px)",
  borderRadius: "28px",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.16)",
  padding: "30px",
  display: "flex",
  flexDirection: "column" as const,
  overflow: "hidden",
},

chatTextPageLight: {
  width: "100%",
  minHeight: "calc(100vh - 120px)",
  borderRadius: "28px",
  background: "rgba(255,255,255,0.90)",
  border: "1px solid rgba(15,23,42,0.14)",
  padding: "30px",
  display: "flex",
  flexDirection: "column" as const,
  overflow: "hidden",
},

chatTextHeader: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "20px",
},

chatTextMessages: {
  flex: 1,
  minHeight: 0,
  overflowY: "auto" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: "14px",
  padding: "10px 4px 20px",
  scrollBehavior: "smooth",
},

textChatUserBubble: {
  alignSelf: "flex-end",
  maxWidth: "70%",
  background: "linear-gradient(135deg, #7c3aed, #d946ef)",
  color: "#ffffff",
  padding: "14px 16px",
  borderRadius: "18px 18px 6px 18px",
  fontSize: "14px",
  lineHeight: 1.5,
  fontWeight: 650,
  boxShadow: "0 12px 30px rgba(124,58,237,0.25)",
},

textChatBotBubble: {
  alignSelf: "flex-start",
  maxWidth: "75%",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ffffff",
  padding: "14px 16px",
  borderRadius: "18px 18px 18px 6px",
  fontSize: "14px",
  lineHeight: 1.5,
  fontWeight: 600,
},

textChatInputBox: {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "12px",
  alignItems: "center",
  borderRadius: "22px",
  padding: "14px",
},

textChatInput: {
  width: "100%",
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: "15px",
  fontWeight: 650,
},

textChatSendButton: {
  border: "none",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
  color: "#ffffff",
  padding: "12px 18px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 900,
  boxShadow: "0 12px 30px rgba(124,58,237,0.30)",
},

sidebarLight: {
  height: "calc(100vh - 36px)",
  borderRadius: "28px",
  background: "rgba(255,255,255,0.86)",
  border: "1px solid rgba(15,23,42,0.10)",
  boxShadow: "0 24px 70px rgba(15,23,42,0.14)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  overflow: "hidden",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
  flexShrink: 0,
  color: "#0f172a",
},

sidebarHeaderLight: {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "18px 20px",
  borderBottom: "1px solid rgba(15,23,42,0.10)",
},

sidebarHistoryItemLight: {
  width: "100%",
  border: "none",
  background: "transparent",
  color: "#334155",
  padding: "8px 10px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 800,
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
},

sidebarHistoryTitleLight: {
  margin: "0 0 10px",
  padding: "0 4px",
  fontSize: "12px",
  fontWeight: 900,
  color: "#64748b",
},

sidebarDeleteButtonLight: {
  width: "24px",
  height: "24px",
  border: "none",
  borderRadius: "8px",
  background: "transparent",
  color: "#64748b",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},

logoSubtitleLight: {
  margin: 0,
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 700,
},

knowledgeGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "18px",
  marginTop: "26px",
},

knowledgeCard: {
  minHeight: "205px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.13)",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease",
},

knowledgeIcon: {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "21px",
  marginBottom: "16px",
  boxShadow: "0 12px 25px rgba(124,58,237,0.35)",
},

knowledgeTitle: {
  margin: "0 0 14px",
  fontSize: "19px",
  fontWeight: 900,
  color: "#ffffff",
},

knowledgeText: {
  margin: 0,
  fontSize: "14px",
  lineHeight: 1.65,
  color: "rgba(255,255,255,0.76)",
},
};