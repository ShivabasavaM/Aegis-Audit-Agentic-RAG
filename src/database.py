import sqlite3

def init_db():
    conn = sqlite3.connect('chat_history.db', check_same_thread=False)
    c = conn.cursor()
    # High-Performance Production Setting
    c.execute('PRAGMA journal_mode=WAL;') 
    c.execute('PRAGMA synchronous=NORMAL;')
    
    c.execute('''CREATE TABLE IF NOT EXISTS sessions 
                 (id INTEGER PRIMARY KEY, title TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    c.execute('''CREATE TABLE IF NOT EXISTS messages 
                 (session_id INTEGER, role TEXT, content TEXT, 
                  FOREIGN KEY(session_id) REFERENCES sessions(id))''')
    conn.commit()
    conn.close()

def create_session(title="New Audit"):
    conn = sqlite3.connect('chat_history.db')
    c = conn.cursor()
    c.execute("INSERT INTO sessions (title) VALUES (?)", (title,))
    new_id = c.lastrowid
    conn.commit()
    conn.close()
    return new_id

def delete_session(session_id):
    conn = sqlite3.connect('chat_history.db')
    c = conn.cursor()
    # Delete messages first due to foreign key
    c.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    c.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()

def update_session_title(session_id, new_title):
    conn = sqlite3.connect('chat_history.db')
    c = conn.cursor()
    c.execute("UPDATE sessions SET title = ? WHERE id = ?", (new_title[:50], session_id))
    conn.commit()
    conn.close()

def save_message(session_id, role, content):
    conn = sqlite3.connect('chat_history.db')
    c = conn.cursor()
    c.execute("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)", 
              (session_id, role, content))
    conn.commit()
    conn.close()

def get_sessions():
    conn = sqlite3.connect('chat_history.db')
    c = conn.cursor()
    c.execute("SELECT id, title FROM sessions ORDER BY timestamp DESC")
    sessions = c.fetchall()
    conn.close()
    return sessions

def get_messages_by_session(session_id):
    conn = sqlite3.connect('chat_history.db')
    c = conn.cursor()
    c.execute("SELECT role, content FROM messages WHERE session_id = ?", (session_id,))
    rows = c.fetchall()
    conn.close()
    return [{"role": r[0], "content": r[1]} for r in rows]