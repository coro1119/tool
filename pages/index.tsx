import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { getAllPosts, Post, generateSlug } from "../lib/posts";

interface HomeProps {
  posts: Post[];
}

export default function Home({ posts }: HomeProps) {
  const [currentFilter, setCurrentFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = posts.filter(p => {
    const matchCategory = currentFilter === "전체" || p.category === currentFilter;
    const matchSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const categories = ["전체", "테슬라", "일론머스크", "해외주식"];

  return (
    <>
      <Head>
        <title>FinanceCalculator — 금융 & 데이터 리서치</title>
        <meta name="description" content="금융 계산과 리서치 데이터를 바탕으로 쉽고 명확한 인사이트를 제공합니다. by Teslaburn" />
        <link rel="canonical" href="https://financecalculator.cloud/" />
        <meta property="og:title" content="FinanceCalculator" />
        <meta property="og:description" content="금융 & 데이터 리서치 인사이트" />
        <meta property="og:url" content="https://financecalculator.cloud/" />
        <meta property="og:type" content="website" />
      </Head>

      <section id="home-view" className="view active">
        <div className="list-header">
          <div className="header-content">
            <h2>Financial Insights</h2>
            <p className="subtitle">데이터로 계산하고 분석하는 금융과 기술의 미래.</p>
          </div>
          
          <div className="search-container">
            <div className="search-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <input 
                type="text" 
                placeholder="궁금한 리서치 키워드를 입력하세요..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="category-chips">
            {categories.map(cat => (
              <button 
                key={cat}
                className={`chip ${currentFilter === cat ? 'active' : ''}`}
                onClick={() => setCurrentFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div id="main-post-list" className="tistory-list">
          {filteredPosts.length > 0 ? filteredPosts.map(post => (
            <Link key={post.id} href={`/post/${generateSlug(post.title)}`} style={{ textDecoration: 'none' }}>
              <article className="post-item">
                <div 
                  className="post-item-thumb" 
                  style={{ backgroundImage: `url('${post.thumb || ''}')` }}
                ></div>
                <div className="post-item-content">
                  <span className="cat">{post.category}</span>
                  <h3>{post.title}</h3>
                  <p>{post.summary}</p>
                </div>
              </article>
            </Link>
          )) : (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
              {searchQuery ? `'${searchQuery}' result not found.` : 'No posts found.'}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const posts = await getAllPosts();
  
  // Convert complex Firebase types to plain objects if needed (like timestamps)
  const plainPosts = posts.map(p => ({
    ...p,
    updatedAt: p.updatedAt ? p.updatedAt.toDate().toISOString() : null
  }));

  return {
    props: {
      posts: plainPosts,
    },
    revalidate: 60, // ISR: update every 60 seconds
  };
};
