import { db } from "./firebaseAdmin";

export interface Post {
    id: string;
    title: string;
    content: string;
    summary: string;
    category: string;
    thumb: string;
    date: string;
    updatedAt?: string | null;
}

export function generateSlug(text: string) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// 헬퍼: Firestore Timestamp -> ISO String 변환
function serializeData(data: any): any {
    if (!data) return null;
    if (data.toDate && typeof data.toDate === 'function') {
        return data.toDate().toISOString();
    }
    return data;
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
                updatedAt: serializeData(data.updatedAt)
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
                updatedAt: serializeData(data.updatedAt)
            } as Post;
        });
    } catch (e) {
        console.error("Error fetching recent posts:", e);
        return [];
    }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
    try {
        // Firestore 컬렉션 전체를 훑어야 하므로 getAllPosts 재사용
        const allPosts = await getAllPosts();
        return allPosts.find(p => generateSlug(p.title) === slug) || null;
    } catch (e) {
        console.error("Error fetching post by slug:", e);
        return null;
    }
}
