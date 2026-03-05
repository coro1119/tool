import { db } from "./firebaseAdmin"; // Admin SDK 사용

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
    try {
        const snap = await db.collection("posts").orderBy("updatedAt", "desc").get();
        return snap.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                title: data.title || '',
                content: data.content || '',
                summary: data.summary || '',
                category: data.category || '',
                thumb: data.thumb || '',
                date: data.date || '',
                updatedAt: data.updatedAt 
            } as Post;
        });
    } catch (e) {
        console.error("Error fetching all posts:", e);
        return [];
    }
}

export async function getRecentPosts(count = 10): Promise<Post[]> {
    try {
        const snap = await db.collection("posts").orderBy("updatedAt", "desc").limit(count).get();
        return snap.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                title: data.title || '',
                content: data.content || '',
                summary: data.summary || '',
                category: data.category || '',
                thumb: data.thumb || '',
                date: data.date || '',
                updatedAt: data.updatedAt 
            } as Post;
        });
    } catch (e) {
        console.error("Error fetching recent posts:", e);
        return [];
    }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
    try {
        // Firestore에는 슬러그 필드가 없으므로 전체를 가져와서 찾음 (Admin SDK는 빠름)
        const posts = await getAllPosts();
        return posts.find(p => generateSlug(p.title) === slug) || null;
    } catch (e) {
        console.error("Error fetching post by slug:", e);
        return null;
    }
}
