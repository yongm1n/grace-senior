'use strict';

// Root URL is shared by all editions, so the crawlable identity must be shared too.
// Only facts that are displayed in the public site are represented here.
const HOME_TITLE = '부산 해운대구 주간보호센터 | 더 그레이스 시니어 주간보호센터';
const HOME_DESCRIPTION = '부산 해운대구 더 그레이스 시니어 주간보호센터입니다. 어르신의 일상 돌봄, 건강관리·인지활동·식사와 송영 서비스를 제공하며 운영 시간은 월–토 08:30–17:30입니다.';
const HOME_URL = 'https://gracedaycare.co.kr/';
const HOME_SEO_HEAD = `
<title>${HOME_TITLE}</title>
<meta name="description" content="${HOME_DESCRIPTION}">
<link rel="canonical" href="${HOME_URL}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="더 그레이스 시니어 주간보호센터">
<meta property="og:title" content="${HOME_TITLE}">
<meta property="og:description" content="${HOME_DESCRIPTION}">
<meta property="og:url" content="${HOME_URL}">
<meta property="og:image" content="https://gracedaycare.co.kr/assets/og.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="부산 해운대구 더 그레이스 시니어 주간보호센터">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${HOME_TITLE}">
<meta name="twitter:description" content="${HOME_DESCRIPTION}">
<meta name="twitter:image" content="https://gracedaycare.co.kr/assets/og.jpg">
<meta name="twitter:image:alt" content="부산 해운대구 더 그레이스 시니어 주간보호센터">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","@id":"https://gracedaycare.co.kr/#website","url":"https://gracedaycare.co.kr/","name":"더 그레이스 시니어 주간보호센터","alternateName":"THE GRACE Senior Day Care","inLanguage":"ko-KR","publisher":{"@id":"https://gracedaycare.co.kr/#localbusiness"}},{"@type":"WebPage","@id":"https://gracedaycare.co.kr/#webpage","url":"https://gracedaycare.co.kr/","name":"${HOME_TITLE}","description":"${HOME_DESCRIPTION}","inLanguage":"ko-KR","isPartOf":{"@id":"https://gracedaycare.co.kr/#website"},"about":{"@id":"https://gracedaycare.co.kr/#localbusiness"},"primaryImageOfPage":{"@id":"https://gracedaycare.co.kr/#primaryimage"}},{"@type":"ImageObject","@id":"https://gracedaycare.co.kr/#primaryimage","url":"https://gracedaycare.co.kr/assets/og.jpg","contentUrl":"https://gracedaycare.co.kr/assets/og.jpg","caption":"부산 해운대구 더 그레이스 시니어 주간보호센터"},{"@type":["LocalBusiness","Organization"],"@id":"https://gracedaycare.co.kr/#localbusiness","name":"더 그레이스 시니어 주간보호센터","alternateName":"THE GRACE Senior Day Care","url":"https://gracedaycare.co.kr/","logo":{"@id":"https://gracedaycare.co.kr/#logo"},"image":{"@id":"https://gracedaycare.co.kr/#primaryimage"},"telephone":"+82-51-791-1797","address":{"@type":"PostalAddress","addressCountry":"KR","addressRegion":"부산광역시","addressLocality":"해운대구","streetAddress":"좌동순환로 78 건우빌딩 5층"},"geo":{"@type":"GeoCoordinates","latitude":35.173290,"longitude":129.167539},"openingHoursSpecification":{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],"opens":"08:30","closes":"17:30"},"areaServed":[{"@type":"AdministrativeArea","name":"부산광역시 해운대구"},{"@type":"Place","name":"송정 일대"}],"hasMap":"https://map.naver.com/p/entry/place/2028121432","sameAs":["https://www.instagram.com/thegrace_daycare/","https://blog.naver.com/the_grace_daycare"],"description":"${HOME_DESCRIPTION}"},{"@type":"ImageObject","@id":"https://gracedaycare.co.kr/#logo","url":"https://gracedaycare.co.kr/assets/logo.png","contentUrl":"https://gracedaycare.co.kr/assets/logo.png","caption":"더 그레이스 시니어 주간보호센터 로고"}]}</script>`;

function stripHomeSeo(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|robots|twitter:[^"']+|og:[^"']+)["'][^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

function withHomeSeo(html) {
  if (!/<head>/i.test(html)) throw new Error('홈페이지 HTML에 <head>가 없습니다.');
  const normalizedFacts = html
    .replace(/해운대로\s*814/g, '좌동순환로 78')
    .replace(/월\s*[-–~]\s*토\s*0?8:30\s*[-–~]\s*17:30/g, '월–토 08:30–17:30');
  const stripped = stripHomeSeo(normalizedFacts);
  const headOpen = stripped.match(/<head\b[^>]*>/i);
  const headClose = stripped.match(/<\/head>/i);
  if (!headOpen || !headClose || headClose.index < headOpen.index) {
    throw new Error('홈페이지 HTML의 <head> 범위를 확인할 수 없습니다.');
  }
  const start = headOpen.index + headOpen[0].length;
  const beforeHead = stripped.slice(0, start);
  const headContent = stripped.slice(start, headClose.index);
  const afterHead = stripped.slice(headClose.index);
  const charsetRe = /<meta\b(?=[^>]*\bcharset\s*=)[^>]*>/i;
  const charset = headContent.match(charsetRe);
  // HTML 인코딩 선언은 문서 첫 1024바이트 안에 있어야 한다. 기존 선언을 head 첫머리로
  // 옮기고 바로 뒤에 관리형 SEO 블록을 붙인다. 선언이 없던 구형 스냅샷도 UTF-8을 명시한다.
  const charsetTag = charset ? charset[0] : '<meta charset="utf-8">';
  const rest = charset ? headContent.replace(charsetRe, '') : headContent;
  return beforeHead + charsetTag + HOME_SEO_HEAD + rest + afterHead;
}

module.exports = { HOME_TITLE, HOME_DESCRIPTION, HOME_URL, stripHomeSeo, withHomeSeo };
