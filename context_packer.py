import os

# --- PODEŠAVANJA ---

# Gde da sačuva rezultat?
OUTPUT_FILE = 'FULL_PROJECT_CONTEXT.txt'

# Folderi koje OBAVEZNO preskačemo (štede tokene i sprečavaju greške)
IGNORE_DIRS = {
    'node_modules', 'venv', 'env', '.git', '__pycache__', 
    '.idea', '.vscode', 'dist', 'build', 'staticfiles', 
    'media', 'migrations' 
}

# Tipovi fajlova koje želimo da pokupimo (tvoj tech stack)
ALLOWED_EXTENSIONS = {
    # Backend (Django)
    '.py', 
    # Frontend (Vue.js)
    '.vue', '.js', '.ts', '.json', 
    # Ostalo
    '.html', '.css', '.md'
}

# Fajlovi koje specifično treba ignorisati (veliki ili nebitni)
IGNORE_FILES = {
    'package-lock.json', 'yarn.lock', 'db.sqlite3', 'poetry.lock', 
    'context_packer.py', OUTPUT_FILE # Ne želimo da skripta upiše samu sebe
}

def generate_context():
    root_path = os.getcwd() # Trenutni folder
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        # 1. Prvo upisujemo strukturu foldera (Tree view) da AI shvati arhitekturu
        outfile.write("### STRUKTURA PROJEKTA ###\n")
        for root, dirs, files in os.walk(root_path):
            # Filtriranje foldera "u letu"
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            level = root.replace(root_path, '').count(os.sep)
            indent = ' ' * 4 * (level)
            outfile.write(f'{indent}{os.path.basename(root)}/\n')
            subindent = ' ' * 4 * (level + 1)
            for f in files:
                if f not in IGNORE_FILES and os.path.splitext(f)[1] in ALLOWED_EXTENSIONS:
                    outfile.write(f'{subindent}{f}\n')
        
        outfile.write("\n" + "="*50 + "\n\n")

        # 2. Zatim upisujemo sadržaj svakog fajla
        print("Pakovanje fajlova u toku...")
        
        for root, dirs, files in os.walk(root_path):
            # Opet filtriramo foldere da ne ulazimo u node_modules itd.
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                # Provera ekstenzije i ignorisanih fajlova
                _, ext = os.path.splitext(file)
                if ext in ALLOWED_EXTENSIONS and file not in IGNORE_FILES:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, root_path)

                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                            
                            # Formatiranje koje AI voli: Jasna putanja fajla
                            outfile.write(f"START OF FILE: {rel_path}\n")
                            outfile.write("-" * 20 + "\n")
                            outfile.write(content)
                            outfile.write("\n" + "-" * 20 + "\n")
                            outfile.write(f"END OF FILE: {rel_path}\n\n")
                            
                            print(f"Dodat: {rel_path}")
                    except Exception as e:
                        print(f"Greška pri čitanju {file_path}: {e}")

    print(f"\n✅ GOTOVO! Ceo projekat je spakovan u: {OUTPUT_FILE}")
    print("Sada možeš uploadovati ovaj fajl u novi chat.")

if __name__ == "__main__":
    generate_context()