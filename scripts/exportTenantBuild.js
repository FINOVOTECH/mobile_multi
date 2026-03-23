#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const ANDROID_RES = path.join(ROOT, "android", "app", "src", "main", "res");
const IOS_APPICON = path.join(
  ROOT,
  "ios",
  "JyotiMF",
  "Images.xcassets",
  "AppIcon.appiconset"
);
const ANDROID_STRINGS = path.join(
  ROOT,
  "android",
  "app",
  "src",
  "main",
  "res",
  "values",
  "strings.xml"
);
const IOS_INFO_PLIST = path.join(ROOT, "ios", "JyotiMF", "Info.plist");
const MOBILE_CONFIG_JS = path.join(ROOT, "src", "helpers", "Config.js");

function arg(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((a) => a.startsWith(prefix));
  if (match) return match.slice(prefix.length).trim();
  return String(fallback || "").trim();
}

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: "inherit", ...opts });
}

function runCapture(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
}

function writeFileSafe(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function sanitizeAppName(name = "") {
  return (
    String(name || "")
      .replace(/\s+/g, " ")
      .replace(/[^\w .&()-]/g, "")
      .trim()
      .slice(0, 28) || "Finovo Wealth"
  );
}

function replaceTagValue(xml, key, value) {
  const escaped = String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const rx = new RegExp(
    `(<key>${key}<\\/key>\\s*<string>)([\\s\\S]*?)(<\\/string>)`
  );
  return xml.replace(rx, `$1${escaped}$3`);
}

async function downloadTo(url, destBase) {
  const timeoutMs = Number(process.env.MOBILE_EXPORT_FETCH_TIMEOUT_MS || 20000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      Accept: "image/*,*/*;q=0.8",
      "User-Agent": "Finovo-Mobile-Export/1.0",
    },
  }).finally(() => clearTimeout(timer));
  if (!res.ok) throw new Error(`Logo download failed: HTTP ${res.status}`);
  const arr = await res.arrayBuffer();
  const contentType = String(
    res.headers.get("content-type") || ""
  ).toLowerCase();
  let ext = ".png";
  if (contentType.includes("webp")) ext = ".webp";
  else if (contentType.includes("jpeg") || contentType.includes("jpg"))
    ext = ".jpg";
  else if (contentType.includes("png")) ext = ".png";
  const finalPath = `${destBase}${ext}`;
  fs.writeFileSync(finalPath, Buffer.from(arr));
  return finalPath;
}

async function resolveLogoFile({ logoUrl, backendBase, tenantId }) {
  const raw = String(logoUrl || "").trim();
  if (!raw) throw new Error("Missing tenant logo URL.");

  const attempts = Number(process.env.MOBILE_EXPORT_FETCH_RETRIES || 2);
  const urlsToTry = [];

  if (/^https?:\/\//i.test(raw)) {
    urlsToTry.push(raw);
  } else if (raw.startsWith("/") && backendBase) {
    urlsToTry.push(`${backendBase}${raw}`);
  } else {
    const abs = path.resolve(raw);
    if (!fs.existsSync(abs)) throw new Error(`Logo file not found: ${raw}`);
    return { path: abs, usedFallback: false };
  }

  let lastErr = "";
  for (const u of urlsToTry) {
    for (let i = 1; i <= attempts; i += 1) {
      try {
        const tmpLogoBase = path.join(os.tmpdir(), `tenant_logo_${tenantId}`);
        const downloaded = await downloadTo(u, tmpLogoBase);
        return { path: downloaded, usedFallback: false };
      } catch (err) {
        lastErr = String(err?.message || err || "fetch failed");
      }
    }
  }

  const fallbackCandidates = [
    path.join(ROOT, "src", "assets", "images", "logo.png"),
    path.join(ANDROID_RES, "mipmap-xxxhdpi", "ic_launcher.png"),
    path.join(IOS_APPICON, "LOGO_JYOTI_1_1024x1024.png"),
  ];
  const fallback = fallbackCandidates.find((p) => fs.existsSync(p));
  if (fallback) {
    process.stderr.write(
      `[mobile-export] logo download failed (${lastErr}). Using fallback logo: ${fallback}\n`
    );
    return { path: fallback, usedFallback: true };
  }

  throw new Error(
    `Logo download failed and no fallback logo found. Last error: ${lastErr}`
  );
}

function detectImageFormat(src) {
  try {
    const out = runCapture("sips", ["-g", "format", src]);
    const m = out.match(/format:\s*([^\n\r]+)/i);
    return String(m?.[1] || "")
      .trim()
      .toLowerCase();
  } catch (_) {
    return "";
  }
}

function ensurePngSource(src, tenantId = "TENANT") {
  const fmt = detectImageFormat(src);
  if (fmt === "png") return src;
  const converted = path.join(
    os.tmpdir(),
    `tenant_logo_${tenantId}_normalized.png`
  );
  run("sips", ["--setProperty", "format", "png", src, "--out", converted]);
  return converted;
}

function renderIcon(src, out, size) {
  run("sips", [
    "-z",
    String(size),
    String(size),
    src,
    "--setProperty",
    "format",
    "png",
    "--out",
    out,
  ]);
}

function applyBranding({ appName, logoFile, tenantId }) {
  const normalizedLogo = ensurePngSource(logoFile, tenantId);
  const androidTargets = [
    ["mipmap-mdpi", 48],
    ["mipmap-hdpi", 72],
    ["mipmap-xhdpi", 96],
    ["mipmap-xxhdpi", 144],
    ["mipmap-xxxhdpi", 192],
  ];
  for (const [dir, size] of androidTargets) {
    const launcher = path.join(ANDROID_RES, dir, "ic_launcher.png");
    const bg = path.join(ANDROID_RES, dir, "ic_launcher_background.png");
    renderIcon(normalizedLogo, launcher, size);
    renderIcon(normalizedLogo, bg, size);
  }

  renderIcon(normalizedLogo, path.join(IOS_APPICON, "LOGO JYOTI (1).png"), 60);
  renderIcon(normalizedLogo, path.join(IOS_APPICON, "LOGO JYOTI (2).png"), 87);
  renderIcon(normalizedLogo, path.join(IOS_APPICON, "LOGO JYOTI (3).png"), 120);
  renderIcon(normalizedLogo, path.join(IOS_APPICON, "LOGO JYOTI (4).png"), 180);
  renderIcon(
    normalizedLogo,
    path.join(IOS_APPICON, "LOGO_JYOTI_1_1024x1024.png"),
    1024
  );

  const stringsXml = fs.readFileSync(ANDROID_STRINGS, "utf8");
  writeFileSafe(
    ANDROID_STRINGS,
    stringsXml.replace(
      /<string name="app_name">[\s\S]*?<\/string>/,
      `<string name="app_name">${appName}</string>`
    )
  );

  const plist = fs.readFileSync(IOS_INFO_PLIST, "utf8");
  writeFileSafe(
    IOS_INFO_PLIST,
    replaceTagValue(plist, "CFBundleDisplayName", appName)
  );
}

function applyDefaultTenantInMobileConfig(tenantId) {
  if (!fs.existsSync(MOBILE_CONFIG_JS)) return;
  const raw = fs.readFileSync(MOBILE_CONFIG_JS, "utf8");
  const next = raw
    .replace(
      /export const defaultTenantId = "[^"]*";/,
      `export const defaultTenantId = "${tenantId}";`
    )
    .replace(/tenantId:\s*defaultTenantId,/, "tenantId: defaultTenantId,");
  fs.writeFileSync(MOBILE_CONFIG_JS, next);
}

function applyApiBaseUrlInMobileConfig(apiBaseUrl) {
  const nextBase = String(apiBaseUrl || "")
    .trim()
    .replace(/\/+$/, "");
  if (!nextBase || !fs.existsSync(MOBILE_CONFIG_JS)) return;
  const escaped = JSON.stringify(nextBase);
  const raw = fs.readFileSync(MOBILE_CONFIG_JS, "utf8");
  const next = raw.replace(
    /const PROD_API_BASE_URL = "[^"]*";/,
    `const PROD_API_BASE_URL = ${escaped};`
  );
  fs.writeFileSync(MOBILE_CONFIG_JS, next);
}

function applyFrontendUrlInMobileConfig(frontendUrl) {
  const nextUrl = String(frontendUrl || "")
    .trim()
    .replace(/\/+$/, "");
  if (!nextUrl || !fs.existsSync(MOBILE_CONFIG_JS)) return;
  const escaped = JSON.stringify(nextUrl);
  const raw = fs.readFileSync(MOBILE_CONFIG_JS, "utf8");
  const next = raw.replace(
    /const PROD_WEB_HOST_TEMPLATE = "[^"]*";/,
    `const PROD_WEB_HOST_TEMPLATE = ${escaped};`
  );
  fs.writeFileSync(MOBILE_CONFIG_JS, next);
}

function applyAndroidPackageId(packageId) {
  const id = String(packageId || "").trim();
  if (!id) return;
  if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(id)) {
    process.stderr.write(
      `[mobile-export] Invalid Android package ID: ${id}, skipping.\n`
    );
    return;
  }
  const gradlePath = path.join(ROOT, "android", "app", "build.gradle");
  if (!fs.existsSync(gradlePath)) return;
  let gradle = fs.readFileSync(gradlePath, "utf8");
  gradle = gradle
    .replace(/namespace\s+"[^"]*"/, `namespace "${id}"`)
    .replace(/applicationId\s+"[^"]*"/, `applicationId "${id}"`);
  fs.writeFileSync(gradlePath, gradle);
}

function applyIosBundleId(bundleId) {
  const id = String(bundleId || "").trim();
  if (!id) return;
  if (!fs.existsSync(IOS_INFO_PLIST)) return;
  let plist = fs.readFileSync(IOS_INFO_PLIST, "utf8");
  plist = replaceTagValue(plist, "CFBundleIdentifier", id);
  fs.writeFileSync(IOS_INFO_PLIST, plist);
}

function exportAndroid(tenantId, uploadsRoot) {
  const sharedGradleHome = path.resolve(
    String(
      process.env.MOBILE_EXPORT_GRADLE_HOME ||
        path.join(os.tmpdir(), "gradle-mobile-cache")
    )
  );
  const sharedProjectCacheDir = path.resolve(
    String(
      process.env.MOBILE_EXPORT_PROJECT_CACHE_DIR ||
        path.join(os.tmpdir(), "gradle-mobile-project-cache")
    )
  );
  const forceCleanCache =
    String(process.env.MOBILE_EXPORT_FORCE_CLEAN_CACHE || "").trim() === "1";

  const clearPath = (p) => {
    try {
      if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
    } catch (_) {
      // ignore cleanup errors
    }
  };

  // Keep Gradle cache persistent between builds to avoid repeated downloads.
  if (forceCleanCache) {
    clearPath(sharedGradleHome);
    clearPath(sharedProjectCacheDir);
    clearPath(path.join(ROOT, "android", ".gradle"));
    clearPath(
      path.join(
        ROOT,
        "node_modules",
        "@react-native",
        "gradle-plugin",
        ".gradle"
      )
    );
  }
  fs.mkdirSync(sharedGradleHome, { recursive: true });
  fs.mkdirSync(sharedProjectCacheDir, { recursive: true });

  const gradleHome = sharedGradleHome;
  const projectCacheDir = sharedProjectCacheDir;
  const gradleCmd = (task) =>
    `cd android && GRADLE_USER_HOME='${gradleHome}' ./gradlew --no-daemon --project-cache-dir '${projectCacheDir}' ${task}`;

  try {
    run("/bin/zsh", ["-lc", gradleCmd("clean assembleRelease")], { cwd: ROOT });
  } catch (firstErr) {
    // Retry once with a fresh cache/workdir if shared cache is corrupted.
    const safeTenant = String(tenantId || "tenant")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    const gradleBase = path.join(os.tmpdir(), `gradle-mobile-${safeTenant}-`);
    try {
      fs.rmSync(sharedGradleHome, { recursive: true, force: true });
      fs.rmSync(sharedProjectCacheDir, { recursive: true, force: true });
    } catch (_) {
      // ignore cleanup errors
    }
    const retryHome = fs.mkdtempSync(gradleBase);
    const retryProjectCache = path.join(retryHome, "project-cache");
    run(
      "/bin/zsh",
      [
        "-lc",
        `cd android && GRADLE_USER_HOME='${retryHome}' ./gradlew --no-daemon --project-cache-dir '${retryProjectCache}' clean assembleRelease`,
      ],
      {
        cwd: ROOT,
      }
    );
  }

  const src = path.join(
    ROOT,
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    "release",
    "app-release.apk"
  );
  if (!fs.existsSync(src))
    throw new Error("Android release APK not generated.");
  const outDir = path.join(uploadsRoot, "mobile", tenantId, "android");
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(src, path.join(outDir, "latest.apk"));
  return path.join(outDir, "latest.apk");
}

function exportIos(tenantId, uploadsRoot) {
  const iosBuildDir = path.join(ROOT, "ios", "build");
  const plist = path.join(os.tmpdir(), `ios_export_${tenantId}.plist`);
  writeFileSafe(
    plist,
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>development</string>
  <key>signingStyle</key><string>automatic</string>
  <key>compileBitcode</key><false/>
  <key>destination</key><string>export</string>
</dict></plist>`
  );

  run("/bin/zsh", ["-lc", "cd ios && pod install"], { cwd: ROOT });
  run(
    "/bin/zsh",
    [
      "-lc",
      `cd ios && xcodebuild -workspace JyotiMF.xcworkspace -scheme JyotiMF -configuration Release -archivePath build/JyotiMF.xcarchive -destination generic/platform=iOS archive`,
    ],
    { cwd: ROOT }
  );
  run(
    "/bin/zsh",
    [
      "-lc",
      `cd ios && xcodebuild -exportArchive -archivePath build/JyotiMF.xcarchive -exportPath build/export -exportOptionsPlist "${plist}"`,
    ],
    { cwd: ROOT }
  );

  const exportDir = path.join(iosBuildDir, "export");
  const ipa = fs
    .readdirSync(exportDir)
    .find((f) => f.toLowerCase().endsWith(".ipa"));
  if (!ipa)
    throw new Error(
      "iOS IPA not generated. Check signing/provisioning in Xcode."
    );
  const src = path.join(exportDir, ipa);
  const outDir = path.join(uploadsRoot, "mobile", tenantId, "ios");
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(src, path.join(outDir, "latest.ipa"));
  return path.join(outDir, "latest.ipa");
}

async function main() {
  const tenantId = String(arg("tenant", process.env.TENANT_ID)).toUpperCase();
  const platform = String(arg("platform", process.env.PLATFORM)).toLowerCase();
  const appName = sanitizeAppName(arg("app-name", process.env.TENANT_APP_NAME));
  let logoUrl = arg("logo-url", process.env.TENANT_LOGO_URL);
  const apiBaseUrl = String(
    arg(
      "api-base-url",
      process.env.BACKEND_BASE_URL || process.env.API_BASE_URL
    )
  ).trim();
  const backendBase = String(process.env.BACKEND_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const uploadsRoot = path.resolve(
    arg(
      "uploads-root",
      process.env.UPLOADS_ROOT || path.join(ROOT, "..", "uploads")
    )
  );

  if (!tenantId) throw new Error("Missing tenant id.");
  if (!["android", "ios"].includes(platform))
    throw new Error("platform must be android or ios.");
  const { path: logoFile, usedFallback } = await resolveLogoFile({
    logoUrl,
    backendBase,
    tenantId,
  });

  const frontendUrl = String(
    arg("frontend-url", process.env.FRONTEND_URL || "")
  ).trim();
  const packageId = String(
    arg("package-id", process.env.ANDROID_PACKAGE_ID || "")
  ).trim();
  const bundleId = String(
    arg("bundle-id", process.env.IOS_BUNDLE_ID || "")
  ).trim();

  applyBranding({ appName, logoFile, tenantId });
  applyDefaultTenantInMobileConfig(tenantId);
  applyApiBaseUrlInMobileConfig(apiBaseUrl);
  applyFrontendUrlInMobileConfig(frontendUrl);
  if (platform === "android") applyAndroidPackageId(packageId);
  if (platform === "ios") applyIosBundleId(bundleId);

  const artifact =
    platform === "android"
      ? exportAndroid(tenantId, uploadsRoot)
      : exportIos(tenantId, uploadsRoot);

  process.stdout.write(
    JSON.stringify({
      success: true,
      tenantId,
      platform,
      appName,
      artifact,
      usedFallbackLogo: !!usedFallback,
    }) + "\n"
  );
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
