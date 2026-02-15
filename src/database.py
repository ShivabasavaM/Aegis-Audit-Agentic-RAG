import sqlite3
import uuid

DB_NAME = 'aegis_audit.db'

def init_db():
    """Initializes the database and creates necessary tables if they don't exist."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Create the sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create the messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            content TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def create_session(title="New Audit"):
    """Creates a new session with a unique UUID and returns the ID."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    session_id = str(uuid.uuid4())
    cursor.execute("INSERT INTO sessions (id, title) VALUES (?, ?)", (session_id, title))
    conn.commit()
    conn.close()
    return session_id

def delete_session(session_id):
    """Deletes a session and all its associated messages."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # Delete messages first to maintain referential integrity
    cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()

def update_session_title(session_id, new_title):
    """Updates the title of a specific session."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("UPDATE sessions SET title = ? WHERE id = ?", (new_title[:50], session_id))
    conn.commit()
    conn.close()

def save_message(session_id, role, content):
    """Saves a single chat message to the database."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)", 
                   (session_id, role, content))
    conn.commit()
    conn.close()

def get_sessions():
    """Retrieves all sessions for the sidebar, matching the unpacking count in app.py."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # Returns only ID and Title to match 'for s_id, s_title in sessions:' in app.py
    cursor.execute("SELECT id, title FROM sessions ORDER BY created_at DESC")
    sessions = cursor.fetchall()
    conn.close()
    return sessions

def get_messages_by_session(session_id):
    """Retrieves all chat messages for a specific session."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT role, content FROM messages WHERE session_id = ? ORDER BY timestamp ASC", (session_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{"role": r[0], "content": r[1]} for r in rows]


# import sqlite3

# def init_db():
#     conn = sqlite3.connect('aegis_audit.db')
#     cursor = conn.cursor()
    
#     # Create the sessions table
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS sessions (
#             id TEXT PRIMARY KEY,
#             title TEXT,
#             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#         )
#     ''')
    
#     # Create the messages table
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS messages (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             session_id TEXT,
#             role TEXT,
#             content TEXT,
#             timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#             FOREIGN KEY (session_id) REFERENCES sessions (id)
#         )
#     ''')
    
#     conn.commit()
#     conn.close()

# def create_session(title="New Audit"):
#     conn = sqlite3.connect('chat_history.db')
#     c = conn.cursor()
#     c.execute("INSERT INTO sessions (title) VALUES (?)", (title,))
#     new_id = c.lastrowid
#     conn.commit()
#     conn.close()
#     return new_id

# def delete_session(session_id):
#     conn = sqlite3.connect('chat_history.db')
#     c = conn.cursor()
#     # Delete messages first due to foreign key
#     c.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
#     c.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
#     conn.commit()
#     conn.close()

# def update_session_title(session_id, new_title):
#     conn = sqlite3.connect('chat_history.db')
#     c = conn.cursor()
#     c.execute("UPDATE sessions SET title = ? WHERE id = ?", (new_title[:50], session_id))
#     conn.commit()
#     conn.close()

# def save_message(session_id, role, content):
#     conn = sqlite3.connect('chat_history.db')
#     c = conn.cursor()
#     c.execute("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)", 
#               (session_id, role, content))
#     conn.commit()
#     conn.close()

# # src/database.py
# def get_sessions():
#     conn = sqlite3.connect('aegis_audit.db')
#     cursor = conn.cursor()
#     # Ensure you are selecting THREE columns
#     cursor.execute("SELECT id, title, created_at FROM sessions ORDER BY created_at DESC")
#     sessions = cursor.fetchall()
#     conn.close()
#     return sessions

# def get_messages_by_session(session_id):
#     conn = sqlite3.connect('chat_history.db')
#     c = conn.cursor()
#     c.execute("SELECT role, content FROM messages WHERE session_id = ?", (session_id,))
#     rows = c.fetchall()
#     conn.close()
#     return [{"role": r[0], "content": r[1]} for r in rows]