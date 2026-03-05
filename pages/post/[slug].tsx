import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import parse from "html-react-parser";
import { getPostBySlug, getRecentPosts, Post, generateSlug } from "../../lib/posts";

interface PostDetailProps {
  post: Post;
  relatedPosts: Post[];
  slug: string;
}

export default function PostDetail({ post, relatedPosts, slug }: PostDetailProps) {
  const fullURL = `https://financecalculator.cloud/post/${slug}`;

  return (
    <>
      <Head>
        <title>{post.title} — FinanceCalculator</title>
        <meta name="description" content={post.summary} />
        <link rel="canonical" href={fullURL} />
        <link rel="alternate" hreflang="ko" href={fullURL} />
        <link rel="alternate" hreflang="en" href={fullURL} />
        <link rel="alternate" hreflang="x-default" href={fullURL} />
        
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.summary} />
        <meta property="og:url" content={fullURL} />
        <meta property="og:type" content="article" />
        {post.thumb && <meta property="og:image" content={post.thumb} />}
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.summary} />
        {post.thumb && <meta name="twitter:image" content={post.thumb} />}
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

          <section className="author-profile-card">
            <div className="author-avatar">T</div>
            <div className="author-bio">
              <h4>Teslaburn</h4>
              <p>혁신 기술과 금융 데이터를 연결하여 새로운 알파를 찾는 독립 리서처입니다. 테슬라와 AI, 에너지 트랜지션을 중점적으로 분석합니다.</p>
              <div className="author-social">
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied!");
                }}>Share Insight</a>
              </div>
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
  const posts = await getRecentPosts(20);
  const paths = posts.map(p => ({
    params: { slug: generateSlug(p.title) }
  }));

  return {
    paths,
    fallback: "blocking", // Generate on-demand if not pre-rendered
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { notFound: true };
  }

  const allPosts = await getRecentPosts(50);
  const relatedPosts = allPosts
    .filter(p => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  // Plain objects for props
  const plainPost = {
    ...post,
    updatedAt: post.updatedAt ? post.updatedAt.toDate().toISOString() : null
  };
  
  const plainRelated = relatedPosts.map(p => ({
    ...p,
    updatedAt: p.updatedAt ? p.updatedAt.toDate().toISOString() : null
  }));

  return {
    props: {
      post: plainPost,
      relatedPosts: plainRelated,
      slug
    },
    revalidate: 60,
  };
};
