const fs = require('fs');
const path = 'C:/apk/android/app/src/main/assets/public/assets/index-BatkhIs-.js';
let code = fs.readFileSync(path, 'utf8');
const original = code;

function replace(oldStr, newStr, label) {
  if (!code.includes(oldStr)) {
    console.error('NOT FOUND: ' + label);
    return;
  }
  const count = code.split(oldStr).length - 1;
  if (count > 1) console.warn('WARNING: ' + label + ' matches ' + count + ' times');
  code = code.replace(oldStr, newStr);
  console.log('OK: ' + label);
}

// ==========================================
// 1. FIX SPINNER: wrap X (save) in try/finally
// ==========================================
replace(
  'X=async()=>{ie(!0);const fe=await(await fetch(e.image_url)).blob(),pe=e.name||"retinal-scan",ne=e.result||"pending",ge=ka(new Date(e.created_date.replace(/Z$/,"")+"Z"),"yyyy-MM-dd"),Se=localStorage.getItem("downloadFormat")||"jpg";await Vf(fe,`${pe}_${ne}_${ge}.${Se}`),ie(!1)}',
  'X=async()=>{ie(!0);try{const fe=await(await fetch(e.image_url)).blob(),pe=e.name||"retinal-scan",ne=e.result||"pending",ge=ka(new Date(e.created_date.replace(/Z$/,"")+"Z"),"yyyy-MM-dd"),Se=localStorage.getItem("downloadFormat")||"jpg";await Vf(fe,`${pe}_${ne}_${ge}.${Se}`)}finally{ie(!1)}}',
  'save spinner try/finally'
);

// ==========================================
// 2. FIX SPINNER: wrap K (export) in try/finally
// ==========================================
replace(
  'K=async Q=>{z(!0),Q==="pdf"?await YH(e,u):Q==="dicom"?await XH(e,u):Q==="fhir"?QH(e,u):ZH(e,u),z(!1)}',
  'K=async Q=>{z(!0);try{Q==="pdf"?await YH(e,u):Q==="dicom"?await XH(e,u):Q==="fhir"?await QH(e,u):await ZH(e,u)}finally{z(!1)}}',
  'export spinner try/finally'
);

// ==========================================
// 3. LOGOUT CONFIRMATION DIALOG
// ==========================================
replace(
  'b.jsxs("button",{className:"as-action-btn",onClick:i,children:[b.jsx(NL,{size:16}),e("logOut")]})',
  'b.jsxs(VC,{children:[b.jsx(u7,{asChild:!0,children:b.jsxs("button",{className:"as-action-btn",children:[b.jsx(NL,{size:16}),e("logOut")]})}),b.jsxs(H2,{children:[b.jsxs(G2,{children:[b.jsx(Y2,{children:e("logoutConfirm")}),b.jsx(X2,{children:e("logoutDesc")})]}),b.jsxs(K2,{children:[b.jsx(Z2,{children:e("cancel")}),b.jsx(Q2,{onClick:i,className:"bg-red-600 hover:bg-red-700",children:e("logOut")})]})]})]})',
  'logout confirmation dialog'
);

// ==========================================
// 4. TRANSLATE "Actions" heading in scan details
// ==========================================
replace(
  'children:"Actions"',
  'children:c("actions")',
  'actions translation'
);

// ==========================================
// 5. TRANSLATE "Appearance" label in settings
// ==========================================
replace(
  'b.jsx(u1,{size:16}),"Appearance"',
  'b.jsx(u1,{size:16}),e("appearance")',
  'appearance translation'
);

// ==========================================
// 6. TRANSLATE System/Light/Dark in select dropdown
// ==========================================
replace(
  'b.jsx(fb,{size:13}),"System"',
  'b.jsx(fb,{size:13}),e("themeSystem")',
  'system theme select'
);
replace(
  'b.jsx(hb,{size:13}),"Light"',
  'b.jsx(hb,{size:13}),e("themeLight")',
  'light theme select'
);
replace(
  'b.jsx(u1,{size:13}),"Dark"',
  'b.jsx(u1,{size:13}),e("themeDark")',
  'dark theme select'
);

// ==========================================
// 7. TRANSLATE date group headers in scan history
// ==========================================
replace(
  'className:"text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-1",children:y})',
  'className:"text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-1",children:c({"Today":"dateToday","Yesterday":"dateYesterday","This Week":"dateThisWeek","Last Week":"dateLastWeek","This Month":"dateThisMonth","Last Month":"dateLastMonth","Earlier This Year":"dateEarlierThisYear","A Long Time Ago":"dateLongAgo"}[y]||y)})',
  'date group headers translation'
);

// ==========================================
// 8. ADD NEW TRANSLATION KEYS TO ALL LANGUAGE OBJECTS
// ==========================================

const newKeys = {
  nD: ',appearance:"Appearance",logoutConfirm:"Log out?",logoutDesc:"You could lose access to your data if you don\'t remember your login credentials.",actions:"Actions",dateToday:"Today",dateYesterday:"Yesterday",dateThisWeek:"This Week",dateLastWeek:"Last Week",dateThisMonth:"This Month",dateLastMonth:"Last Month",dateEarlierThisYear:"Earlier This Year",dateLongAgo:"A Long Time Ago"',
  rD: ',appearance:"Erscheinungsbild",logoutConfirm:"Abmelden?",logoutDesc:"Sie könnten den Zugriff auf Ihre Daten verlieren, wenn Sie Ihre Anmeldedaten vergessen.",actions:"Aktionen",dateToday:"Heute",dateYesterday:"Gestern",dateThisWeek:"Diese Woche",dateLastWeek:"Letzte Woche",dateThisMonth:"Diesen Monat",dateLastMonth:"Letzten Monat",dateEarlierThisYear:"Früher in diesem Jahr",dateLongAgo:"Vor langer Zeit"',
  iD: ',appearance:"Apariencia",logoutConfirm:"¿Cerrar sesión?",logoutDesc:"Podría perder el acceso a sus datos si no recuerda sus credenciales de inicio de sesión.",actions:"Acciones",dateToday:"Hoy",dateYesterday:"Ayer",dateThisWeek:"Esta Semana",dateLastWeek:"La Semana Pasada",dateThisMonth:"Este Mes",dateLastMonth:"El Mes Pasado",dateEarlierThisYear:"Antes Este Año",dateLongAgo:"Hace Mucho Tiempo"',
  oD: ',appearance:"Apparence",logoutConfirm:"Se déconnecter ?",logoutDesc:"Vous pourriez perdre l\'accès à vos données si vous ne vous souvenez pas de vos identifiants.",actions:"Actions",dateToday:"Aujourd\'hui",dateYesterday:"Hier",dateThisWeek:"Cette Semaine",dateLastWeek:"La Semaine Dernière",dateThisMonth:"Ce Mois-ci",dateLastMonth:"Le Mois Dernier",dateEarlierThisYear:"Plus tôt Cette Année",dateLongAgo:"Il y a Longtemps"',
  sD: ',appearance:"المظهر",logoutConfirm:"تسجيل الخروج؟",logoutDesc:"قد تفقد الوصول إلى بياناتك إذا لم تتذكر بيانات تسجيل الدخول.",actions:"الإجراءات",dateToday:"اليوم",dateYesterday:"أمس",dateThisWeek:"هذا الأسبوع",dateLastWeek:"الأسبوع الماضي",dateThisMonth:"هذا الشهر",dateLastMonth:"الشهر الماضي",dateEarlierThisYear:"في وقت سابق من هذا العام",dateLongAgo:"منذ زمن طويل"',
  aD: ',appearance:"外观",logoutConfirm:"退出登录？",logoutDesc:"如果您不记得登录凭据，可能会失去对数据的访问权限。",actions:"操作",dateToday:"今天",dateYesterday:"昨天",dateThisWeek:"本周",dateLastWeek:"上周",dateThisMonth:"本月",dateLastMonth:"上个月",dateEarlierThisYear:"今年早些时候",dateLongAgo:"很久以前"',
  lD: ',appearance:"Aparência",logoutConfirm:"Sair?",logoutDesc:"Você pode perder acesso aos seus dados se não se lembrar das suas credenciais de login.",actions:"Ações",dateToday:"Hoje",dateYesterday:"Ontem",dateThisWeek:"Esta Semana",dateLastWeek:"Semana Passada",dateThisMonth:"Este Mês",dateLastMonth:"Mês Passado",dateEarlierThisYear:"Mais Cedo Este Ano",dateLongAgo:"Há Muito Tempo"',
  cD: ',appearance:"उपस्थिति",logoutConfirm:"लॉग आउट?",logoutDesc:"यदि आप अपने लॉगिन क्रेडेंशियल याद नहीं रखते तो आप अपने डेटा तक पहुंच खो सकते हैं।",actions:"क्रियाएं",dateToday:"आज",dateYesterday:"कल",dateThisWeek:"इस सप्ताह",dateLastWeek:"पिछले सप्ताह",dateThisMonth:"इस महीने",dateLastMonth:"पिछले महीने",dateEarlierThisYear:"इस साल पहले",dateLongAgo:"बहुत समय पहले"',
};

const langEndings = {
  nD: 'grantCameraAccess:"Grant Access"}',
  rD: 'grantCameraAccess:"Zugriff gewähren"}',
  iD: 'grantCameraAccess:"Otorgar acceso"}',
  oD: 'grantCameraAccess:"Autoriser"}',
  sD: 'grantCameraAccess:"منح الوصول"}',
  aD: 'grantCameraAccess:"授予访问"}',
  lD: 'grantCameraAccess:"Conceder acesso"}',
  cD: 'grantCameraAccess:"पहुंच दें"}',
};

for (const [lang, ending] of Object.entries(langEndings)) {
  const newEnding = ending.slice(0, -1) + newKeys[lang] + '}';
  replace(ending, newEnding, lang + ' new translation keys');
}

// ==========================================
// SAVE
// ==========================================
if (code === original) {
  console.error('ERROR: No changes were made!');
  process.exit(1);
}
fs.writeFileSync(path, code);
console.log('\nDone! File written.');
