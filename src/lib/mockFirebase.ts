
// Mock types to match Firebase SDK
export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  photoURL: string | null;
  providerData: any[];
  tenantId: string | null;
}

class MockAuth {
  private currentUser: MockUser | null = null;
  private listeners: ((user: MockUser | null) => void)[] = [];

  constructor() {
    const savedUser = localStorage.getItem('skillgap_mock_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  onAuthStateChanged(callback: (user: MockUser | null) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  async signInAnonymously() {
    this.currentUser = {
      uid: 'guest-' + Math.random().toString(36).substr(2, 9),
      email: null,
      displayName: 'Guest User',
      emailVerified: false,
      isAnonymous: true,
      photoURL: null,
      providerData: [],
      tenantId: null
    };
    localStorage.setItem('skillgap_mock_user', JSON.stringify(this.currentUser));
    this.notify();
    return { user: this.currentUser };
  }

  async signInWithEmailAndPassword(email: string, _password?: string) {
    this.currentUser = {
      uid: 'user-' + btoa(email).substr(0, 10),
      email: email,
      displayName: email.split('@')[0],
      emailVerified: true,
      isAnonymous: false,
      photoURL: null,
      providerData: [],
      tenantId: null
    };
    localStorage.setItem('skillgap_mock_user', JSON.stringify(this.currentUser));
    this.notify();
    return { user: this.currentUser };
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('skillgap_mock_user');
    this.notify();
  }

  async signInWithPopup() {
    return this.signInWithEmailAndPassword('demo@example.com');
  }

  get auth() { return this; }
}

class MockFirestore {
  private data: Record<string, any> = {};

  constructor() {
    const savedData = localStorage.getItem('skillgap_mock_db');
    if (savedData) {
      this.data = JSON.parse(savedData);
    }
  }

  private save() {
    localStorage.setItem('skillgap_mock_db', JSON.stringify(this.data));
  }

  doc(collectionPath: string, ...segments: string[]) {
    const path = [collectionPath, ...segments].join('/');
    return { path, id: segments[segments.length - 1] };
  }

  collection(collectionPath: string, ...segments: string[]) {
    const path = [collectionPath, ...segments].join('/');
    return { path };
  }

  async getDoc(docRef: any) {
    const value = this.data[docRef.path];
    return {
      exists: () => !!value,
      data: () => value,
      id: docRef.id
    };
  }

  async setDoc(docRef: any, data: any, _options?: any) {
    this.data[docRef.path] = data;
    this.save();
  }

  async updateDoc(docRef: any, data: any) {
    const existing = this.data[docRef.path] || {};
    // Handle nested dot notation for milestones.discovery etc.
    const updated = { ...existing };
    Object.keys(data).forEach(key => {
      if (key.includes('.')) {
        const parts = key.split('.');
        let curr = updated;
        for (let i = 0; i < parts.length - 1; i++) {
          curr[parts[i]] = { ...curr[parts[i]] };
          curr = curr[parts[i]];
        }
        curr[parts[parts.length - 1]] = data[key];
      } else {
        updated[key] = data[key];
      }
    });
    this.data[docRef.path] = updated;
    this.save();
  }

  async addDoc(colRef: any, data: any) {
    const id = Math.random().toString(36).substr(2, 9);
    const path = `${colRef.path}/${id}`;
    this.data[path] = { ...data, id };
    this.save();
    return { id, path };
  }

  async deleteDoc(docRef: any) {
    delete this.data[docRef.path];
    this.save();
  }

  onSnapshot(ref: any, callback: (snapshot: any) => void) {
    // Basic reactive loop using setInterval for mock
    const check = () => {
      const allKeys = Object.keys(this.data);
      const isDocument = ref.path.split('/').length % 2 === 0;

      if (isDocument) {
        const value = this.data[ref.path];
        callback({
          exists: () => !!value,
          data: () => value,
          id: ref.id
        });
      } else {
        const docs = allKeys
          .filter(k => k.startsWith(ref.path + '/') && k.split('/').length === ref.path.split('/').length + 1)
          .map(k => ({
            id: k.split('/').pop(),
            data: () => this.data[k]
          }));
        callback({ docs });
      }
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }

  async query(colRef: any, ...constraints: any[]) {
    return colRef;
  }
}

export const mockAuth = new MockAuth();
export const mockDb = new MockFirestore();
