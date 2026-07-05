import { 
  collection, doc, setDoc, getDoc, getDocs, 
  query, where, orderBy, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { ChatSession, Message } from '../types';

const CHATS_COLLECTION = 'chats';

export async function getUserSessions(userId: string): Promise<ChatSession[]> {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const sessions: ChatSession[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push(doc.data() as ChatSession);
    });
    return sessions;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

export async function saveSession(session: ChatSession): Promise<void> {
  try {
    const docRef = doc(db, CHATS_COLLECTION, session.id);
    await setDoc(docRef, session);
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

export async function deleteSessionFromDb(sessionId: string): Promise<void> {
  try {
    const docRef = doc(db, CHATS_COLLECTION, sessionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}
