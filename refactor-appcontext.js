const fs = require('fs');
const path = require('path');

const contextFile = path.join(__dirname, 'src', 'contexts', 'AppContext.tsx');
let content = fs.readFileSync(contextFile, 'utf8');

// 1. Remove MOCK_USERS and MOCK_WORKSPACE
content = content.replace(/\/\/ SEC-003 FIX[\s\S]*?const MOCK_WORKSPACE: Workspace = \{[\s\S]*?\};\n/, '');

// 2. Adjust useMockAuth state
content = content.replace(/const \[useMockAuth, setUseMockAuth\] = useState\(false\);\n/, '');

// 3. Adjust constructor useEffect
content = content.replace(
  /useEffect\(\(\) => \{\n\s+const configured = isSupabaseConfigured\(\);\n\s+setUseMockAuth\(!configured\);\n\n\s+if \(!configured\) \{\n\s+console\.warn\('.*?'\);\n\s+\}\n\s+\}, \[\]\);/,
  `useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured. Application requires Supabase credentials (.env) to function securely.');
    }
  }, []);`
);

// 4. Remove useMockAuth from initAuth inside useEffect
const initAuthMock = /if \(useMockAuth\) \{[\s\S]*?initializedRef\.current = true;\n\s+return;\n\s+\}\n\n\s+/g;
content = content.replace(initAuthMock, '');

// Adjust useMockAuth around onAuthStateChange
content = content.replace(/if \(!useMockAuth\) \{\n\s+const \{ data \} = supabase\.auth/g, 'const { data } = supabase.auth');
// find the closing brace of the `if (!useMockAuth)` 
// It's lines before `subscription = data.subscription;`
// actually maybe the easiest way is just regex:
content = content.replace(/\s+subscription = data\.subscription;\n\s+\}/, '\n      subscription = data.subscription;');
content = content.replace(/\}, \[useMockAuth\]\);/g, '}, []);');

// 5. Remove useMockAuth from login
const loginMock = /if \(useMockAuth\) \{[\s\S]*?\} \/\/\n\n\s+/; // wait, there's a return. let's just use string replace since it's exactly known.
content = content.replace(/if \(useMockAuth\) \{[\s\S]*?toast\.success\(`Bem-vindo, \$\{userWithoutPassword\.name\}!`\);\n\s+return;\n\s+\}\n\n\s+/g, '');

// 6. Remove useMockAuth from logout
content = content.replace(/if \(useMockAuth\) \{[\s\S]*?toast\.success\('Sessão terminada'\);\n\s+return;\n\s+\}\n\n\s+/g, '');

// 7. Remove useMockAuth from register
content = content.replace(/if \(useMockAuth\) \{[\s\S]*?toast\.success\(`Conta criada com sucesso! Bem-vindo, \$\{data\.name\}!`\);\n\s+return;\n\s+\}\n\n\s+/g, '');

fs.writeFileSync(contextFile, content);
console.log('App Context Refactored!');
