# Empire TV — arte e áudio da revisão 10007

O cenário e os dois atlas foram gerados com a ferramenta integrada de geração de imagens e incluídos no projeto. Não usam fotografia de pessoas reais identificadas. As profissões e os retratos são fictícios; o atlas oferece 24 retratos, distribuídos pelo catálogo.

Arquivos finais:

- app/src/main/assets/art/studio-campus.png
- app/src/main/assets/art/talent-atlas.png
- app/src/main/assets/art/poster-atlas.png
- app/src/main/assets/audio/: oito faixas originais de 190 segundos e cinco efeitos.

As músicas foram compostas por uma partitura e sintetizador determinísticos em tools/build-studio-audio.py. Não contêm amostras de músicas comerciais. Os WAVs já estão incluídos; não é necessário recompô-los para compilar o APK.

## Prompts usados

**Estúdio**

Use case: stylized-concept. Asset type: original background illustration for Empire TV, a premium film-and-television management game by V&D Digital. Create a polished large landscape 3D isometric cutaway film studio campus at blue hour, cinematic deep teal and navy, warm amber practical lights, elegant architectural detail. Six connected visibly distinct rooms: writers room with storyboards and desks, sound stage with camera rigs and a city set, editing suite with monitors, sound recording room with acoustic panels, marketing office with poster boards, screening theater with red seats. Exterior courtyard with plants and a small golden crown atop a television-shaped entrance sculpture. Original visual identity, a professional game scene, crisp intentional geometry and rich materials, welcoming and highly legible. Full scene fits the frame; no UI, no words, no labels, no logos from other companies, no real celebrity likenesses. Wide landscape 3:2 composition, highest detailed resolution available, artwork to be used behind clickable room controls.

**Retratos**

Use case: stylized-concept. Asset type: portrait atlas for original fictional professionals in Empire TV, a sophisticated television management game. Make ONE carefully arranged contact sheet, exactly SIX columns by FOUR rows, 24 equally sized rectangular cells, no gaps, all heads and shoulders centered inside their own cell. Each cell has one different fictional film professional, varied adults ages 24 through 72, rich diversity of genders, skin tones, curly/straight hair, beards, glasses, wardrobe, personalities. All original people, none resembling a specific celebrity. Tasteful semi-realistic 3D game character portraits, premium sculpted soft lighting, textured navy teal and amber studio backgrounds, expressive friendly facial features. A director with headphones, a writer with round glasses, a performer in a blazer, a silver-haired actor, a marketer, a dubbing performer, and many other distinct professionals. No words, no borders, no props that cover faces. Exactly 24 individual portrait tiles aligned in a perfect 6-by-4 grid; one person per tile, no heads cut off. Landscape 3:2 canvas, high resolution. Atlas will be used directly with CSS background positions, so each cell must be a clean consistent crop.

**Artes de gênero**

Use case: stylized-concept. Asset type: 12 cinematic genre poster artworks for original Empire TV game catalog, used as a single atlas with CSS backgrounds. ONE landscape 3:2 canvas, exactly SIX columns and TWO rows, 12 equally sized vertical cells perfectly aligned with no gaps or borders. Each cell is a different highly polished original painted film poster with no text whatsoever. Left to right top row: action with motorcycle chase at sunset; comedy with colorful small town theater mishap; drama with two siblings on a rainy train platform; horror with eerie foggy abandoned house; romance with couple silhouette by golden seaside; science fiction with orbital station and astronaut. Left to right bottom row: fantasy with luminous forest and ancient stone arch; thriller with noir detective in rainy neon city; adventure with tropical mountains and expedition; animation with charming original whimsical fox and floating island; documentary with beautiful human hands and old photographic archive; reality competition with theatrical spotlights and colorful contestants silhouettes. Elegant cohesive cinematic visual art, distinct compelling palette in every panel, no recognizable existing movie characters, no real brands, no letters or title blocks, no watermarks. Preserve exact 6-column 2-row layout. High detailed resolution.

© V&D Digital. Todos os direitos reservados.
