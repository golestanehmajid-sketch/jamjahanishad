import { fetch } from 'undici';
fetch("http://localhost:3000/api/sports-hub/news")
  .then(r=>r.json())
  .then(j => console.log(JSON.stringify(j, null, 2)))
  .catch(e => console.error(e));
