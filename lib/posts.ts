import { db } from "./firebase";
import { collection, query, orderBy, getDocs, doc, getDoc, limit } from "firebase/firestore";

export interface Post {
    id: string;
    title: string;
    content: string;
    summary: string;
    category: string;
    thumb: string;
    date: string;
    updatedAt?: any;
}

export function generateSlug(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export async function getAllPosts(): Promise<Post[]> {
    const q = query(collection(db, "posts"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
}

export async function getRecentPosts(count = 10): Promise<Post[]> {
    const q = query(collection(db, "posts"), orderBy("updatedAt", "desc"), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
}

export async function getPostById(id: string): Promise<Post | null> {
    const d = await getDoc(doc(db, "posts", id));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() } as Post;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
    // Note: Since Firestore doesn't store slugs, we fetch all and find the matching one.
    // In a larger app, you'd store the slug in Firestore.
    const all = await getAllPosts();
    return all.find(p => generateSlug(p.title) === slug) || null;
}
