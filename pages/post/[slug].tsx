import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import parse from "html-react-parser";
import { useEffect } from "react";
import { getPostBySlug, getRecentPosts, Post, generateSlug } from "../../lib/posts";

interface PostDetailProps {
  post: Post | null;
  relatedPosts: Post[];
  slug: string;
  error?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function PostDetail({ post, relatedPosts, slug, error }: PostDetailProps) {
  const fullURL = `https://financecalculator.cloud/post/${slug}`;

  // AdSense
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, [slug]);

  // DB 에러 혹은 글 없음 확인용 (404 대신 이 화면이 떠야 라우팅 성공임)
  if (!post) {
    return (
      <div className="container" style={{ padding: "100px 0", textAlign: "center", color: "#fff" }}>
        <h2>System Diagnosis Mode</h2>
        <p>현재 페이지의 라우팅은 정상입니다.</p>
        <p>하지만 데이터를 불러오지 못했습니다.</p>
        <div style={{ background: "#333", padding: "20px", margin: "20px auto", maxWidth: "600px", borderRadius: "8px", textAlign: "left" }}>
          <p><strong>Slug:</strong> {slug}</p>
          <p><strong>Status:</strong> {error || "Post not found in DB"}</p>
        </div>
        <Link href="/" style={{ color: "var(--accent)" }}>Go Home</Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{post.title} — FinanceCalculator</title>
        <meta name="description" content={post.summary} />
        <link rel="canonical" href={fullURL} />
        <link rel="alternate" hrefLang="ko" href={fullURL} />
        <link rel="alternate" hrefLang="en" href={fullURL} />
        <link rel="alternate" hrefLang="x-default" href={fullURL} />
        
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.summary} />
        <meta property="og:url" content={fullURL} />
        <meta property="og:type" content="article" />
        {post.thumb && <meta property="og:image" content={post.thumb} />}
      </Head>

      <section id="post-view" className="view active">
        <article className="post-detail-container">
          <header className="post-detail-header">
            <span className="category-tag">{post.category}</span>
            <h2>{post.title}</h2>
            <div className="post-info">
              <span>{post.date}</span>
              <span className="dot">·</span>
              <span className="author">by Teslaburn</span>
            </div>
          </header>
          
          <div className="post-content-body">
            {parse(post.content)}
          </div>

          <div className="post-ad-wrapper" style={{ margin: '40px 0', textAlign: 'center' }}>
            <ins className="adsbygoogle"
                 style={{ display: 'block', textAlign: 'center' }}
                 data-ad-layout="in-article"
                 data-ad-format="fluid"
                 data-ad-client="ca-pub-1366039516093309"
                 data-ad-slot="YOUR_AD_SLOT"></ins>
          </div>

          <section className="author-profile-card">
            <div className="author-avatar">T</div>
            <div className="author-bio">
              <h4>Teslaburn</h4>
              <p>혁신 기술과 금융 데이터를 연결하여 새로운 알파를 찾는 독립 리서처입니다. 테슬라와 AI, 에너지 트랜지션을 중점적으로 분석합니다.</p>
            </div>
          </section>

          {relatedPosts.length > 0 && (
            <div id="related-posts-section" className="related-posts-area">
              <h4 className="section-title">Related Insights</h4>
              <div className="related-grid">
                {relatedPosts.map(rp => (
                  <Link key={rp.id} href={`/post/${generateSlug(rp.title)}`} style={{ textDecoration: 'none' }}>
                    <div className="related-item">
                      <div className="related-thumb" style={{ backgroundImage: `url('${rp.thumb || ''}')` }}></div>
                      <div className="related-info">
                        <span className="cat">{rp.category}</span>
                        <h5>{rp.title}</h5>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const posts = await getRecentPosts(20);
    const paths = posts.map(p => ({
      params: { slug: generateSlug(p.title) }
    }));
    return { paths, fallback: "blocking" };
  } catch (e) {
    console.error("getStaticPaths error:", e);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  try {
    const post = await getPostBySlug(slug);
    
    // DB에서 못 찾아도 404를 띄우지 않고, 에러 내용을 포함한 페이지를 리턴함 (디버깅용)
    if (!post) {
      return { 
        props: { post: null, relatedPosts: [], slug, error: "Data fetch returned null" },
        revalidate: 10 
      };
    }

    const allPosts = await getRecentPosts(50);
    const relatedPosts = allPosts
      .filter(p => p.id !== post.id && p.category === post.category)
      .slice(0, 3);

    const plainPost = {
      ...post,
      updatedAt: post.updatedAt ? (typeof post.updatedAt === 'string' ? post.updatedAt : JSON.stringify(post.updatedAt)) : null
    };
    
    const plainRelated = relatedPosts.map(p => ({
      ...p,
      updatedAt: p.updatedAt ? (typeof p.updatedAt === 'string' ? p.updatedAt : JSON.stringify(p.updatedAt)) : null
    }));

    return {
      props: { post: plainPost, relatedPosts: plainRelated, slug },
      revalidate: 60,
    };
  } catch (e: any) {
    console.error("getStaticProps error for slug:", slug, e);
    // 예외 발생 시에도 404 방지
    return { 
      props: { post: null, relatedPosts: [], slug, error: e.toString() },
      revalidate: 10 
    };
  }
};
