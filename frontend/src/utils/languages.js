export const LANGUAGES = [
  { id: 'python',     name: 'Python',     color: '#3b82f6', ext: '.py',  monacoId: 'python' },
  { id: 'javascript', name: 'JavaScript', color: '#f59e0b', ext: '.js',  monacoId: 'javascript' },
  { id: 'typescript', name: 'TypeScript', color: '#60a5fa', ext: '.ts',  monacoId: 'typescript' },
  { id: 'cpp',        name: 'C++',        color: '#a78bfa', ext: '.cpp', monacoId: 'cpp' },
  { id: 'java',       name: 'Java',       color: '#f97316', ext: '.java',monacoId: 'java' },
  { id: 'go',         name: 'Go',         color: '#2dd4bf', ext: '.go',  monacoId: 'go' },
  { id: 'rust',       name: 'Rust',       color: '#fb923c', ext: '.rs',  monacoId: 'rust' },
];

export const getLanguage = (id) =>
  LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];

export const DEFAULT_CODE = {
  python: `# Welcome to CodeSync!\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`,
  javascript: `// Welcome to CodeSync!\n\nfunction main() {\n  console.log("Hello, World!");\n}\n\nmain();\n`,
  typescript: `// Welcome to CodeSync!\n\nfunction main(): void {\n  console.log("Hello, World!");\n}\n\nmain();\n`,
  cpp: `// Welcome to CodeSync!\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  java: `// Welcome to CodeSync!\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
  go: `// Welcome to CodeSync!\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n`,
  rust: `// Welcome to CodeSync!\nfn main() {\n    println!("Hello, World!");\n}\n`,
};
