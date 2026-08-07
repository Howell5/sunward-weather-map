import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const DATA_BASE = "https://geo.datav.aliyun.com/areas_v3/bound";
const COUNTRY_CODE = "100000";
const OUTPUT_DIR = resolve("public/data");
const MUNICIPALITIES = new Set([110000, 120000, 310000, 500000]);
const DIRECT_CITIES = new Set([710000, 810000, 820000]);
const CAPITALS = new Set([
  "石家庄市",
  "太原市",
  "呼和浩特市",
  "沈阳市",
  "长春市",
  "哈尔滨市",
  "南京市",
  "杭州市",
  "合肥市",
  "福州市",
  "南昌市",
  "济南市",
  "郑州市",
  "武汉市",
  "长沙市",
  "广州市",
  "南宁市",
  "海口市",
  "成都市",
  "贵阳市",
  "昆明市",
  "拉萨市",
  "西安市",
  "兰州市",
  "西宁市",
  "银川市",
  "乌鲁木齐市",
]);

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "qingyu-weather-map-data-preparer/0.1" },
  });
  if (!response.ok) {
    throw new Error(`Failed ${response.status}: ${url}`);
  }
  return response.json();
}

function shortName(name) {
  return name
    .replace(/特别行政区$/u, "")
    .replace(/维吾尔自治区$/u, "")
    .replace(/壮族自治区$/u, "")
    .replace(/回族自治区$/u, "")
    .replace(/自治区$/u, "")
    .replace(/自治州$/u, "")
    .replace(/地区$/u, "")
    .replace(/市$/u, "")
    .replace(/盟$/u, "");
}

function makeCity(feature, provinceName, importance = 20) {
  const properties = feature.properties ?? {};
  const coordinates = properties.center ?? properties.centroid;
  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !coordinates.every(Number.isFinite)
  ) {
    return null;
  }
  const adcode = String(properties.adcode);
  const name = properties.name;
  if (!adcode || !name) return null;
  return {
    id: adcode,
    adcode,
    name,
    shortName: shortName(name),
    province: provinceName,
    longitude: coordinates[0],
    latitude: coordinates[1],
    importance,
    aliases: [...new Set([name, shortName(name)])],
  };
}

await mkdir(OUTPUT_DIR, { recursive: true });

const countryUrl = `${DATA_BASE}/${COUNTRY_CODE}_full.json`;
const country = await fetchJson(countryUrl);
country.features = country.features.map((feature) => {
  if (feature.properties?.adcode === "100000_JD" && !feature.properties.name) {
    return {
      ...feature,
      properties: { ...feature.properties, name: "南海诸岛" },
    };
  }
  return feature;
});

const cities = [];
for (const province of country.features) {
  const properties = province.properties ?? {};
  const adcode = Number(properties.adcode);
  const provinceName = properties.name;
  if (!Number.isFinite(adcode) || !provinceName) continue;

  if (MUNICIPALITIES.has(adcode) || DIRECT_CITIES.has(adcode)) {
    const city = makeCity(province, provinceName, 100);
    if (city) cities.push(city);
    continue;
  }

  const provinceData = await fetchJson(`${DATA_BASE}/${adcode}_full.json`);
  for (const feature of provinceData.features ?? []) {
    if (feature.properties?.level !== "city") continue;
    const importance = CAPITALS.has(feature.properties.name) ? 90 : 20;
    const city = makeCity(feature, provinceName, importance);
    if (city) cities.push(city);
  }
}

cities.sort((a, b) => Number(a.adcode) - Number(b.adcode));
const ids = new Set(cities.map((city) => city.id));
if (ids.size !== cities.length) {
  throw new Error(`Duplicate city ids: ${cities.length - ids.size}`);
}
if (cities.length < 300) {
  throw new Error(`Expected at least 300 cities, received ${cities.length}`);
}

await writeFile(resolve(OUTPUT_DIR, "china.geojson"), JSON.stringify(country));
await writeFile(
  resolve(OUTPUT_DIR, "cities.json"),
  JSON.stringify(
    {
      version: "2026-08-07",
      generatedAt: new Date().toISOString(),
      source: DATA_BASE,
      count: cities.length,
      cities,
    },
    null,
    2,
  ),
);

console.log(`Prepared ${cities.length} city points and ${country.features.length} map features.`);
