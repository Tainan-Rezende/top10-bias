import fs from 'fs/promises';

// Lista abrangente cobrindo todas as gerações de K-Pop e solistas
const GROUPS_CATALOG = [
  // 5th Gen
  { group: "BABYMONSTER", query: "BABYMONSTER members" },
  { group: "ILLIT", query: "ILLIT members" },
  { group: "MEOVV", query: "MEOVV members" },
  { group: "IZNA", query: "izna members" },
  { group: "TWS", query: "TWS members" },
  { group: "BOYNEXTDOOR", query: "BOYNEXTDOOR members" },
  { group: "ZEROBASEONE", query: "ZEROBASEONE members" },
  { group: "RIIZE", query: "RIIZE members" },
  { group: "KISS OF LIFE", query: "KISS OF LIFE members" },
  { group: "tripleS", query: "tripleS members" },
  { group: "KATSEYE", query: "KATSEYE members" },
  { group: "RESCENE", query: "RESCENE members" },
  { group: "BADVILLAIN", query: "BADVILLAIN members" },
  { group: "NEXZ", query: "NEXZ members" },

  // 4th Gen
  { group: "AESPA", query: "aespa members" },
  { group: "IVE", query: "IVE members" },
  { group: "LE SSERAFIM", query: "LE SSERAFIM members" },
  { group: "NEWJEANS", query: "NewJeans members" },
  { group: "STRAY KIDS", query: "Stray Kids members" },
  { group: "ENHYPEN", query: "ENHYPEN members" },
  { group: "TXT", query: "TOMORROW X TOGETHER members" },
  { group: "ITZY", query: "ITZY members" },
  { group: "NMIXX", query: "NMIXX members" },
  { group: "(G)I-DLE", query: "(G)I-DLE members" },
  { group: "STAYC", query: "STAYC members" },
  { group: "ATEEZ", query: "ATEEZ members" },
  { group: "THE BOYZ", query: "THE BOYZ members" },
  { group: "TREASURE", query: "TREASURE members" },
  { group: "KEP1ER", query: "Kep1er members" },
  { group: "CRAVITY", query: "CRAVITY members" },
  { group: "EVERGLOW", query: "EVERGLOW members" },
  { group: "FROMIS_9", query: "fromis_9 members" },
  { group: "LOONA / ARTMS / LOOSSEMBLE", query: "LOONA members" },
  { group: "ONEUS", query: "ONEUS members" },
  { group: "P1HARMONY", query: "P1Harmony members" },
  { group: "TEMPEST", query: "TEMPEST members" },
  { group: "EPEX", query: "EPEX members" },
  { group: "XIKERS", query: "xikers members" },

  // 3rd Gen
  { group: "BLACKPINK", query: "BLACKPINK members" },
  { group: "BTS", query: "BTS members" },
  { group: "TWICE", query: "TWICE members" },
  { group: "RED VELVET", query: "Red Velvet members" },
  { group: "SEVENTEEN", query: "SEVENTEEN members" },
  { group: "EXO", query: "EXO members" },
  { group: "NCT 127", query: "NCT 127 members" },
  { group: "NCT DREAM", query: "NCT DREAM members" },
  { group: "WAYV", query: "WayV members" },
  { group: "GOT7", query: "GOT7 members" },
  { group: "MONSTA X", query: "MONSTA X members" },
  { group: "MAMAMOO", query: "MAMAMOO members" },
  { group: "GFRIEND / VIVIZ", query: "GFRIEND members" },
  { group: "WJSN", query: "WJSN members" },
  { group: "OH MY GIRL", query: "OH MY GIRL members" },
  { group: "ASTRO", query: "ASTRO members" },
  { group: "DAY6", query: "DAY6 members" },
  { group: "iKON", query: "iKON members" },
  { group: "WINNER", query: "WINNER members" },
  { group: "BTOB", query: "BTOB members" },
  { group: "VIXX", query: "VIXX members" },
  { group: "DREAMCATCHER", query: "DREAMCATCHER members" },
  { group: "MOMOLAND", query: "MOMOLAND members" },
  { group: "CLC", query: "CLC members" },
  { group: "KARD", query: "KARD members" },

  // 2nd Gen & Legends
  { group: "GIRLS' GENERATION", query: "Girls' Generation members" },
  { group: "SHINee", query: "SHINee members" },
  { group: "BIGBANG", query: "BIGBANG members" },
  { group: "2NE1", query: "2NE1 members" },
  { group: "SUPER JUNIOR", query: "Super Junior members" },
  { group: "2PM", query: "2PM members" },
  { group: "INFINITE", query: "INFINITE members" },
  { group: "HIGHLIGHT / BEAST", query: "HIGHLIGHT members" },
  { group: "APINK", query: "Apink members" },
  { group: "SISTAR", query: "SISTAR members" },
  { group: "GIRL'S DAY", query: "Girl's Day members" },
  { group: "KARA", query: "KARA members" },
  { group: "T-ARA", query: "T-ARA members" },
  { group: "4MINUTE", query: "4MINUTE members" },
  { group: "F(X)", query: "f(x) members" },
  { group: "EXID", query: "EXID members" },
  { group: "SHINHWA", query: "SHINHWA members" },
  { group: "TVXQ!", query: "TVXQ! members" }
];

const FAMOUS_SOLOISTS = [
  { name: "IU", group: "SOLOIST", wikiTitle: "IU" },
  { name: "Taeyeon", group: "GIRLS' GENERATION", wikiTitle: "Taeyeon (Girls' Generation)" },
  { name: "Sunmi", group: "SOLOIST", wikiTitle: "Sunmi" },
  { name: "Chungha", group: "SOLOIST", wikiTitle: "Chungha" },
  { name: "SomI", group: "SOLOIST", wikiTitle: "Jeon Somi" },
  { name: "HyunA", group: "SOLOIST", wikiTitle: "HyunA" },
  { name: "BoA", group: "SOLOIST", wikiTitle: "BoA" },
  { name: "Rain", group: "SOLOIST", wikiTitle: "Rain" },
  { name: "PSY", group: "SOLOIST", wikiTitle: "PSY" },
  { name: "Jessi", group: "SOLOIST", wikiTitle: "Jessi (musician)" },
  { name: "Kang Daniel", group: "SOLOIST", wikiTitle: "Kang Daniel" },
  { name: "Woodz", group: "SOLOIST", wikiTitle: "WOODZ" },
  { name: "Wonho", group: "SOLOIST", wikiTitle: "Wonho (singer)" },
  { name: "BIBI", group: "SOLOIST", wikiTitle: "BIBI" },
  { name: "Lee Hi", group: "SOLOIST", wikiTitle: "Lee Hi" }
];

function cleanIdolName(rawTitle) {
  const match = rawTitle.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return { name: match[1].trim(), groupTag: match[2].trim() };
  }
  return { name: rawTitle.trim(), groupTag: "" };
}

function isValidMember(page, groupName) {
  const title = (page.title || "").trim();
  const titleLower = title.toLowerCase();
  const filename = (page.pageimage || "").toLowerCase();

  if (titleLower === groupName.toLowerCase()) return false;
  if (title.includes('/') || title.includes(':')) return false;

  const badImages = /album_cover|single_cover|cover_art|digital_cover|digital_album|poster|placeholder|group_concept|group_profile|group_photo|logo|banner|tracklist/i;
  if (badImages.test(filename)) return false;

  const mediaWords = /\b(album|single|ep|tour|concert|duo|sub-unit|unit|group|gang|project|remix|edition|ver\.|ost|discography|videography|awards)\b/i;
  if (mediaWords.test(titleLower)) return false;

  return true;
}

async function fetchMembersForGroup(groupObj) {
  const endpoint = `https://kpop.fandom.com/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(groupObj.query)}&gsrlimit=20&prop=pageimages|categories&cllimit=50&pithumbsize=350&format=json`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    if (!data.query?.pages) return [];

    const idols = [];
    for (const page of Object.values(data.query.pages)) {
      if (!page.thumbnail?.source) continue;
      if (!isValidMember(page, groupObj.group)) continue;

      const { name } = cleanIdolName(page.title);

      idols.push({
        id: page.pageid,
        name: name,
        group: groupObj.group.toUpperCase(),
        wikiTitle: page.title,
        img: page.thumbnail.source
      });
    }
    return idols;
  } catch (err) {
    console.error(`Erro em ${groupObj.group}:`, err.message);
    return [];
  }
}

async function fetchSoloist(soloist) {
  const endpoint = `https://kpop.fandom.com/api.php?action=query&titles=${encodeURIComponent(soloist.wikiTitle)}&prop=pageimages&pithumbsize=350&format=json`;
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    if (!data.query?.pages) return null;
    const page = Object.values(data.query.pages)[0];
    if (!page.thumbnail?.source) return null;

    return {
      id: page.pageid,
      name: soloist.name,
      group: soloist.group.toUpperCase(),
      wikiTitle: soloist.wikiTitle,
      img: page.thumbnail.source
    };
  } catch (err) {
    return null;
  }
}

async function run() {
  console.log(`Iniciando indexação dos grupos de K-Pop e solistas...`);
  const idolsMap = new Map();

  for (const item of GROUPS_CATALOG) {
    process.stdout.write(`Indexando ${item.group}... `);
    const members = await fetchMembersForGroup(item);
    members.forEach(m => {
      if (!idolsMap.has(m.wikiTitle)) {
        idolsMap.set(m.wikiTitle, m);
      }
    });
    console.log(`+${members.length} membros`);
    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`Indexando solistas principais...`);
  for (const s of FAMOUS_SOLOISTS) {
    const soloist = await fetchSoloist(s);
    if (soloist && !idolsMap.has(soloist.wikiTitle)) {
      idolsMap.set(soloist.wikiTitle, soloist);
    }
  }

  const catalog = Array.from(idolsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  await fs.writeFile('./idols.json', JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`\nBase concluída com sucesso! Total de ${catalog.length} idols indexados e vinculados aos seus grupos em idols.json.`);
}

run();