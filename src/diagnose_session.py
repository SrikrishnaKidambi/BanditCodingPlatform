import sys
import glob
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
import session

print('DATA_DIR=', session.DATA_DIR)
print('files=', glob.glob(os.path.join(session.DATA_DIR, '*.json')))
conn = session._connect_db()
print('conn', conn)
if conn is not None:
    try:
        cur = conn.cursor()
        cur.execute('SELECT 1')
        print('db ok', cur.fetchone())
        cur.close()
    except Exception as e:
        print('db error', repr(e))
    finally:
        conn.close()
