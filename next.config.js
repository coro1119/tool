/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // 이 설정이 핵심입니다: 모든 페이지를 HTML로 정적 추출
  images: {
    unoptimized: true, // 정적 모드에서는 이미지 최적화 서버를 쓸 수 없으므로 끔
  },
  trailingSlash: false, // URL 끝에 /를 붙이지 않음 (Firebase 호환성)
}

module.exports = nextConfig
