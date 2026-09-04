import { useMemo, useState } from 'react';
import { Activity, ArrowRight, CirclePlay, Dumbbell, Gauge, Info, Search, Video, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

type Movement = {
  id: string; name: string; category: string; equipment: string; level: string; objective: string;
  steps: string[]; attention: string[]; accent: string; videoUrl?: string; cards?: MovementCard[];
};

type MovementCard = {
  image: string;
  title: { pt: string; en: string; de: string };
  description: { pt: string; en: string; de: string };
};

const skiErgCards: MovementCard[] = [
  {
    image: '/media/movements/skierg/start-position.jpeg',
    title: { pt: '1. Posição inicial alta e atlética', en: '1. Tall athletic start position', de: '1. Aufrechte, athletische Startposition' },
    description: { pt: 'Mantenha os pés aproximadamente na largura dos ombros, joelhos levemente flexionados, abdômen ativado e mãos um pouco acima dos olhos. Os dois pés permanecem sobre a plataforma.', en: 'Keep the feet approximately shoulder-width apart, knees slightly bent, core engaged and hands slightly above eye level. Both feet remain on the platform.', de: 'Stelle die Füße etwa schulterbreit auf, beuge die Knie leicht, spanne den Rumpf an und halte die Hände knapp über Augenhöhe. Beide Füße bleiben auf der Plattform.' },
  },
  {
    image: '/media/movements/skierg/drive-initiation.jpeg',
    title: { pt: '2. Inicie pelo tronco e pelo quadril', en: '2. Initiate through the core and hips', de: '2. Bewegung aus Rumpf und Hüfte einleiten' },
    description: { pt: 'Comece a puxada ativando abdômen e dorsais. Incline o tronco por meio de uma dobradiça no quadril; os braços acompanham o movimento em vez de produzir toda a força.', en: 'Begin the pull by engaging the core and lats. Hinge at the hips and let the arms follow the movement instead of producing all the force.', de: 'Beginne den Zug, indem du Rumpf und Latissimus anspannst. Klappe den Oberkörper über eine Hüftbeuge ab; die Arme folgen der Bewegung, statt die gesamte Kraft zu erzeugen.' },
  },
  {
    image: '/media/movements/skierg/power-finish.jpeg',
    title: { pt: '3. Conduza os puxadores até as coxas', en: '3. Drive the handles toward the thighs', de: '3. Griffe bis zu den Oberschenkeln führen' },
    description: { pt: 'Conduza simultaneamente os puxadores para baixo, mantendo a coluna neutra e uma flexão moderada dos joelhos. Finalize com as mãos próximas às coxas, sem lançar os braços para trás.', en: 'Drive both handles downward together while maintaining a neutral spine and moderate knee bend. Finish with the hands close to the thighs without throwing the arms backward.', de: 'Ziehe beide Griffe gleichzeitig nach unten, während du eine neutrale Wirbelsäule und eine moderate Kniebeugung beibehältst. Beende die Bewegung mit den Händen nahe an den Oberschenkeln, ohne die Arme nach hinten zu schleudern.' },
  },
  {
    image: '/media/movements/skierg/finish-and-recovery.jpeg',
    title: { pt: '4. Retorne com controle', en: '4. Recover under control', de: '4. Kontrolliert zurückführen' },
    description: { pt: 'Estenda quadris e joelhos, eleve o tronco e permita que os braços retornem suavemente à posição inicial. Preserve tensão e ritmo contínuos, sem deixar as cordas chicotearem.', en: 'Extend the hips and knees, raise the torso and allow the arms to return smoothly to the start. Maintain continuous tension and rhythm without letting the cords snap.', de: 'Strecke Hüfte und Knie, richte den Oberkörper auf und lasse die Arme sanft in die Ausgangsposition zurückkehren. Halte durchgehend Spannung und Rhythmus, ohne die Seile durchschlagen zu lassen.' },
  },
  {
    image: '/media/movements/skierg/common-errors.jpeg',
    title: { pt: '5. Evite estes erros', en: '5. Avoid these mistakes', de: '5. Vermeide diese Fehler' },
    description: { pt: 'Não puxe somente com os braços, não faça um agachamento profundo, não arredonde a coluna e não termine totalmente ereto com as mãos baixas. Busque uma dobradiça eficiente e um ciclo fluido.', en: 'Do not pull only with the arms, perform a deep squat, round the spine or finish fully upright with the hands low. Use an efficient hip hinge and a fluid cycle.', de: 'Ziehe nicht nur mit den Armen, gehe nicht in eine tiefe Kniebeuge, runde nicht den Rücken und beende die Bewegung nicht komplett aufrecht mit tiefen Händen. Achte auf eine effiziente Hüftbeuge und einen flüssigen Zyklus.' },
  },
];

const rowErgCards: MovementCard[] = [
  {
    image: '/media/movements/rowerg/setup-and-rules.jpeg',
    title: { pt: '1. Configuração e distância', en: '1. Setup and distance', de: '1. Einrichtung und Distanz' },
    description: { pt: 'A estação tem 1.000 m. Prenda os pés antes de segurar o puxador e mantenha-os nos suportes durante todo o exercício. Como referência inicial, use damper 5 para Women, 6 para Women Pro e Men, e 7 para Men Pro; ajuste conforme sua técnica e preferência. Ao terminar, aguarde a confirmação antes de sair do equipamento.', en: 'The station is 1,000 m. Secure your feet before gripping the handle and keep them inside the foot holders throughout the exercise. As a starting reference, use damper 5 for Women, 6 for Women Pro and Men, and 7 for Men Pro; adjust it to your technique and preference. After finishing, wait for confirmation before leaving the machine.', de: 'Die Station umfasst 1.000 m. Schnalle die Füße fest, bevor du den Griff fasst, und lass sie während der gesamten Übung in den Fußhaltern. Nutze als Ausgangswert Widerstandsstufe 5 für Women, 6 für Women Pro und Men sowie 7 für Men Pro; passe sie an deine Technik und Vorliebe an. Warte nach dem Abschluss die Bestätigung ab, bevor du das Gerät verlässt.' },
  },
  {
    image: '/media/movements/rowerg/catch.jpeg',
    title: { pt: '2. O catch', en: '2. The catch', de: '2. Der Catch' },
    description: { pt: 'Comece com as canelas próximas da vertical, braços estendidos, punhos planos, ombros relaxados e cabeça neutra. Incline o tronco para a frente a partir do quadril, sem arredondar a lombar nem comprimir demais os joelhos.', en: 'Begin with the shins close to vertical, arms straight, wrists flat, shoulders relaxed and head neutral. Hinge forward from the hips without rounding the lower back or over-compressing the knees.', de: 'Beginne mit nahezu senkrechten Schienbeinen, gestreckten Armen, flachen Handgelenken, lockeren Schultern und neutralem Kopf. Beuge den Oberkörper aus der Hüfte nach vorn, ohne den unteren Rücken zu runden oder die Knie zu stark zu komprimieren.' },
  },
  {
    image: '/media/movements/rowerg/drive-sequence.jpeg',
    title: { pt: '3. Drive: pernas, tronco e braços', en: '3. Drive: legs, body and arms', de: '3. Drive: Beine, Rumpf und Arme' },
    description: { pt: 'Empurre primeiro com as pernas até estendê-las, abra o quadril em seguida e somente então puxe com os braços. Mantenha o puxador em uma trajetória horizontal e finalize abaixo das costelas. A força nasce nas pernas, não nos braços.', en: 'Push with the legs first until they extend, open the hips second and only then pull with the arms. Keep the handle on a horizontal path and finish below the ribs. Power begins in the legs, not the arms.', de: 'Drücke zuerst mit den Beinen, bis sie gestreckt sind, öffne danach die Hüfte und ziehe erst dann mit den Armen. Halte den Griff auf einer horizontalen Bahn und beende die Bewegung unterhalb der Rippen. Die Kraft entsteht in den Beinen, nicht in den Armen.' },
  },
  {
    image: '/media/movements/rowerg/strong-finish.jpeg',
    title: { pt: '4. Finalização forte e controlada', en: '4. Strong, controlled finish', de: '4. Kraftvoller, kontrollierter Abschluss' },
    description: { pt: 'Termine cada puxada com as pernas totalmente estendidas, abdômen firme e uma leve inclinação do tronco para trás. Leve o puxador abaixo das costelas, mantendo punhos planos e ombros relaxados. Evite reclinar excessivamente.', en: 'Finish every stroke with the legs fully extended, core braced and a slight backward body lean. Bring the handle below the ribs while keeping the wrists flat and shoulders relaxed. Avoid excessive backward lean.', de: 'Beende jeden Zug mit vollständig gestreckten Beinen, angespanntem Rumpf und einer leichten Rücklage des Oberkörpers. Führe den Griff unter die Rippen und halte dabei die Handgelenke flach und die Schultern locker. Vermeide eine übermäßige Rücklage.' },
  },
  {
    image: '/media/movements/rowerg/recovery-sequence.jpeg',
    title: { pt: '5. Recuperação: braços, tronco e pernas', en: '5. Recovery: arms, body and legs', de: '5. Recovery: Arme, Rumpf und Beine' },
    description: { pt: 'Faça a sequência inversa: afaste primeiro as mãos, incline o tronco para a frente e só depois flexione os joelhos. Espere o puxador passar pelos joelhos antes de avançar o banco. Use uma recuperação paciente, aproximadamente duas vezes mais longa que o drive.', en: 'Reverse the sequence: send the hands away first, hinge the body forward and only then bend the knees. Let the handle clear the knees before sliding the seat forward. Use a patient recovery, approximately twice as long as the drive.', de: 'Führe die Sequenz umgekehrt aus: Löse zuerst die Hände, beuge dann den Oberkörper nach vorn und beuge erst danach die Knie. Warte, bis der Griff die Knie passiert hat, bevor du den Sitz nach vorn gleiten lässt. Gestalte die Recovery ruhig, etwa doppelt so lang wie den Drive.' },
  },
  {
    image: '/media/movements/rowerg/common-mistakes.jpeg',
    title: { pt: '6. Evite estes erros', en: '6. Avoid these mistakes', de: '6. Vermeide diese Fehler' },
    description: { pt: 'Não puxe primeiro com os braços, não deixe os joelhos subirem antes da passagem do puxador, não recline excessivamente, não arredonde a coluna e não apresse a recuperação. Memorize: drive em pernas–tronco–braços; retorno em braços–tronco–pernas.', en: 'Do not pull with the arms first, let the knees rise before the handle passes, lean too far backward, round the spine or rush the recovery. Remember: drive is legs–body–arms; recovery is arms–body–legs.', de: 'Ziehe nicht zuerst mit den Armen, lass die Knie nicht vor dem Passieren des Griffs hochkommen, lehne dich nicht zu weit zurück, runde nicht den Rücken und hetze die Recovery nicht. Merke dir: Drive ist Beine–Rumpf–Arme; Rückweg ist Arme–Rumpf–Beine.' },
  },
];

const farmersCarryCards: MovementCard[] = [
  {
    image: '/media/movements/farmers-carry/distance-and-loads.jpeg',
    title: { pt: '1. Distância e cargas oficiais', en: '1. Official distance and loads', de: '1. Offizielle Distanz und Gewichte' },
    description: { pt: 'A distância é de 200 m em todas as categorias. Women Open: 2 × 16 kg; Men Open: 2 × 24 kg; Women Pro: 2 × 24 kg; Men Pro: 2 × 32 kg. Use sempre duas cargas iguais.', en: 'The distance is 200 m in every division. Women Open: 2 × 16 kg; Men Open: 2 × 24 kg; Women Pro: 2 × 24 kg; Men Pro: 2 × 32 kg. Always use two matching weights.', de: 'Die Distanz beträgt in allen Kategorien 200 m. Women Open: 2 × 16 kg; Men Open: 2 × 24 kg; Women Pro: 2 × 24 kg; Men Pro: 2 × 32 kg. Verwende immer zwei gleiche Gewichte.' },
  },
  {
    image: '/media/movements/farmers-carry/controlled-lift.jpeg',
    title: { pt: '2. Levante as duas cargas com controle', en: '2. Lift both weights with control', de: '2. Beide Gewichte kontrolliert anheben' },
    description: { pt: 'Posicione os pés aproximadamente na largura do quadril, firme a pegada, ative o abdômen e faça uma dobradiça no quadril com leve flexão dos joelhos. Mantenha a coluna neutra e levante os dois kettlebells juntos.', en: 'Set the feet approximately hip-width apart, secure the grip, brace the core and hinge at the hips with a slight knee bend. Keep a neutral spine and lift both kettlebells together.', de: 'Stelle die Füße etwa hüftbreit auf, fixiere den Griff, spanne den Rumpf an und beuge dich mit leicht gebeugten Knien aus der Hüfte. Halte die Wirbelsäule neutral und hebe beide Kettlebells gleichzeitig an.' },
  },
  {
    image: '/media/movements/farmers-carry/tall-stable-walk.jpeg',
    title: { pt: '3. Caminhe alto e estável', en: '3. Walk tall and stable', de: '3. Aufrecht und stabil gehen' },
    description: { pt: 'Olhe para a frente, mantenha o tronco alto, ombros baixos, abdômen firme e braços totalmente estendidos ao lado do corpo. Use passos curtos e rápidos, evitando balanço lateral das cargas.', en: 'Look forward and keep a tall torso, shoulders down, core braced and arms fully extended by your sides. Use short, quick steps and prevent the weights from swinging sideways.', de: 'Blicke nach vorn, halte den Oberkörper aufrecht, die Schultern tief, den Rumpf angespannt und die Arme vollständig gestreckt neben dem Körper. Mache kurze, schnelle Schritte und verhindere ein seitliches Pendeln der Gewichte.' },
  },
  {
    image: '/media/movements/farmers-carry/grip-and-rhythm.jpeg',
    title: { pt: '4. Pegada, respiração e ritmo', en: '4. Grip, breathing and rhythm', de: '4. Griff, Atmung und Rhythmus' },
    description: { pt: 'Segure o centro das alças com os polegares fechados e punhos neutros. Respire de forma ritmada sem relaxar o tronco. Preserve uma cadência controlada e faça as curvas sem cruzar os pés.', en: 'Grip the center of the handles with closed thumbs and neutral wrists. Breathe rhythmically without losing trunk tension. Maintain a controlled cadence and turn without crossing the feet.', de: 'Greife die Mitte der Griffe mit geschlossenen Daumen und neutralen Handgelenken. Atme rhythmisch, ohne die Rumpfspannung zu verlieren. Halte eine kontrollierte Kadenz und drehe in den Kurven, ohne die Füße zu kreuzen.' },
  },
  {
    image: '/media/movements/farmers-carry/rest-and-finish.jpeg',
    title: { pt: '5. Descanse e finalize corretamente', en: '5. Rest and finish correctly', de: '5. Richtig pausieren und beenden' },
    description: { pt: 'É permitido apoiar os kettlebells para descansar, mas eles não podem avançar ao serem colocados no chão. Na chegada, atravesse primeiro a linha com as duas cargas e depois devolva-as em pé, dentro da área indicada.', en: 'You may set the kettlebells down to rest, but they must not move forward while being placed on the floor. At the finish, cross the line with both weights first, then return them upright inside the marked area.', de: 'Du darfst die Kettlebells zum Ausruhen absetzen, sie dürfen dabei aber nicht nach vorn bewegt werden. Am Ziel überquerst du zuerst die Linie mit beiden Gewichten und stellst sie danach stehend im markierten Bereich ab.' },
  },
  {
    image: '/media/movements/farmers-carry/common-mistakes.jpeg',
    title: { pt: '6. Evite estes erros', en: '6. Avoid these mistakes', de: '6. Vermeide diese Fehler' },
    description: { pt: 'Não eleve os ombros, não flexione os cotovelos, não incline o tronco para compensar a carga e não permita que os kettlebells balancem amplamente. Reduza o ritmo ou descanse se perder a postura.', en: 'Do not shrug the shoulders, bend the elbows, lean the torso to compensate for the load or let the kettlebells swing widely. Slow down or rest if you lose posture.', de: 'Ziehe die Schultern nicht hoch, beuge die Ellbogen nicht, neige den Oberkörper nicht, um die Last auszugleichen, und lass die Kettlebells nicht stark schwingen. Verlangsame das Tempo oder pausiere, wenn du die Haltung verlierst.' },
  },
];

const sandbagLungeCards: MovementCard[] = [
  {
    image: '/media/movements/sandbag-lunges/distance-and-loads.jpeg',
    title: { pt: '1. Distância e cargas oficiais', en: '1. Official distance and loads', de: '1. Offizielle Distanz und Gewichte' },
    description: { pt: 'Complete 100 m. Women Open usa 10 kg; Women Pro e Men Open usam 20 kg; Men Pro usa 30 kg. Mantenha o sandbag atravessado sobre os dois ombros durante toda a estação.', en: 'Complete 100 m. Women Open uses 10 kg; Women Pro and Men Open use 20 kg; Men Pro uses 30 kg. Keep the sandbag across both shoulders throughout the station.', de: 'Absolviere 100 m. Women Open nutzt 10 kg; Women Pro und Men Open nutzen 20 kg; Men Pro nutzt 30 kg. Trage den Sandbag während der gesamten Station quer über beiden Schultern.' },
  },
  {
    image: '/media/movements/sandbag-lunges/lift-and-start.jpeg',
    title: { pt: '2. Levante e comece corretamente', en: '2. Lift and start correctly', de: '2. Korrekt aufnehmen und starten' },
    description: { pt: 'Levante o sandbag com controle e sem ajuda, coloque-o atravessado sobre os dois ombros e fique totalmente ereto. Comece com os dois pés atrás da linha; o primeiro passo deve atravessá-la.', en: 'Lift the sandbag under control without assistance, place it across both shoulders and stand fully upright. Begin with both feet behind the line; the first step must cross it.', de: 'Hebe den Sandbag kontrolliert und ohne Hilfe an, lege ihn quer über beide Schultern und richte dich vollständig auf. Beginne mit beiden Füßen hinter der Linie; der erste Schritt muss sie überqueren.' },
  },
  {
    image: '/media/movements/sandbag-lunges/step-and-knee-touch.jpeg',
    title: { pt: '3. Avance e toque o joelho', en: '3. Step forward and touch the knee', de: '3. Ausschreiten und das Knie aufsetzen' },
    description: { pt: 'Dê um passo longo e controlado para a frente, mantenha o tronco alto e o pé dianteiro completamente apoiado. Desça até o joelho traseiro tocar claramente o chão; um joelho suspenso não completa a repetição.', en: 'Take a long, controlled step forward, keep the torso tall and the front foot fully planted. Lower until the rear knee clearly touches the floor; a hovering knee does not complete the repetition.', de: 'Mache einen langen, kontrollierten Schritt nach vorn, halte den Oberkörper aufrecht und den vorderen Fuß vollständig aufgesetzt. Senke dich ab, bis das hintere Knie den Boden deutlich berührt; ein schwebendes Knie zählt die Wiederholung nicht.' },
  },
  {
    image: '/media/movements/sandbag-lunges/stand-and-alternate.jpeg',
    title: { pt: '4. Fique ereto e alterne as pernas', en: '4. Stand tall and alternate legs', de: '4. Aufrichten und die Beine wechseln' },
    description: { pt: 'Empurre o chão, estenda completamente quadril e joelhos e termine cada repetição totalmente ereto. A perna que estava atrás deve executar o próximo passo. Não dê passos extras nem arraste os pés entre os afundos.', en: 'Push through the floor, fully extend the hips and knees and finish every repetition fully upright. The leg that was behind must take the next step. Do not take extra steps or shuffle between lunges.', de: 'Drücke dich vom Boden ab, strecke Hüfte und Knie vollständig und beende jede Wiederholung komplett aufrecht. Das Bein, das hinten war, führt den nächsten Schritt aus. Mache keine zusätzlichen Schritte und schlurfe nicht zwischen den Ausfallschritten.' },
  },
  {
    image: '/media/movements/sandbag-lunges/lines-and-finish.jpeg',
    title: { pt: '5. Cruze corretamente as linhas', en: '5. Cross the lines correctly', de: '5. Die Linien korrekt überqueren' },
    description: { pt: 'O pé dianteiro precisa cruzar completamente cada linha. Na curva, coloque os dois pés atrás da linha antes de reiniciar. Na chegada, cruze a linha final e somente depois devolva o sandbag à área indicada.', en: 'The front foot must completely cross every line. At the turn, place both feet behind the line before restarting. At the finish, cross the final line before returning the sandbag to the marked area.', de: 'Der vordere Fuß muss jede Linie vollständig überqueren. An der Wende stellst du beide Füße hinter die Linie, bevor du neu startest. Im Ziel überquerst du die letzte Linie, bevor du den Sandbag im markierten Bereich abgibst.' },
  },
  {
    image: '/media/movements/sandbag-lunges/common-mistakes.jpeg',
    title: { pt: '6. Evite estes erros', en: '6. Avoid these mistakes', de: '6. Vermeide diese Fehler' },
    description: { pt: 'Evite não tocar o joelho no chão, levantar sem extensão completa, repetir a mesma perna, dar passos extras, retirar o sandbag dos dois ombros ou deixar o pé dianteiro antes da linha. Priorize controle e repetições válidas.', en: 'Avoid failing to touch the knee to the floor, standing without full extension, repeating the same leg, taking extra steps, removing the sandbag from both shoulders or leaving the front foot short of the line. Prioritize control and valid repetitions.', de: 'Vermeide es, das Knie nicht am Boden zu berühren, ohne vollständige Streckung aufzustehen, dasselbe Bein zu wiederholen, zusätzliche Schritte zu machen, den Sandbag von einer Schulter rutschen zu lassen oder den vorderen Fuß vor der Linie zu lassen. Priorisiere Kontrolle und gültige Wiederholungen.' },
  },
];

const wallBallCards: MovementCard[] = [
  {
    image: '/media/movements/wall-ball/start-tall.jpeg',
    title: { pt: '1. Comece totalmente ereto', en: '1. Start fully upright', de: '1. Vollständig aufrecht starten' },
    description: { pt: 'Complete 100 repetições válidas. Women Open: bola de 4 kg e alvo a 2,70 m; Men Open: 6 kg e 3,00 m; Women Pro: 6 kg e 2,70 m; Men Pro: 9 kg e 3,00 m. Antes da primeira repetição, fique totalmente ereto, com quadris e joelhos estendidos, e segure a bola junto ao peito com as duas mãos.', en: 'Complete 100 valid repetitions. Women Open: 4 kg ball and 2.70 m target; Men Open: 6 kg and 3.00 m; Women Pro: 6 kg and 2.70 m; Men Pro: 9 kg and 3.00 m. Before the first repetition, stand fully upright with hips and knees extended and hold the ball at chest height with both hands.', de: 'Absolviere 100 gültige Wiederholungen. Women Open: 4-kg-Ball und Ziel bei 2,70 m; Men Open: 6 kg und 3,00 m; Women Pro: 6 kg und 2,70 m; Men Pro: 9 kg und 3,00 m. Stelle dich vor der ersten Wiederholung vollständig aufrecht hin, mit gestreckter Hüfte und gestreckten Knien, und halte den Ball mit beiden Händen auf Brusthöhe.' },
  },
  {
    image: '/media/movements/wall-ball/below-parallel.jpeg',
    title: { pt: '2. Agache abaixo da paralela', en: '2. Squat below parallel', de: '2. Unter die Parallele agachen' },
    description: { pt: 'Desça com controle até a dobra do quadril ficar claramente abaixo do topo dos joelhos. Mantenha os calcanhares estáveis, os joelhos alinhados aos pés e a bola próxima ao peito.', en: 'Descend under control until the hip crease is clearly below the top of the knees. Keep the heels stable, knees tracking over the feet and the ball close to the chest.', de: 'Senke dich kontrolliert ab, bis die Hüftfalte deutlich unter die Kniekehlen sinkt. Halte die Fersen stabil, die Knie in Linie mit den Füßen und den Ball nah am Körper.' },
  },
  {
    image: '/media/movements/wall-ball/leg-drive.jpeg',
    title: { pt: '3. Gere impulso com as pernas', en: '3. Drive with your legs', de: '3. Schwung aus den Beinen erzeugen' },
    description: { pt: 'Estenda primeiro joelhos e quadris e transfira esse impulso para a bola. Depois, guie-a para cima com as duas mãos. Evite depender somente dos braços ou lançar a bola para trás.', en: 'Extend the knees and hips first and transfer that drive into the ball. Then guide it upward with both hands. Avoid relying only on the arms or throwing the ball backward.', de: 'Strecke zuerst Knie und Hüfte und übertrage diesen Schwung auf den Ball. Führe ihn danach mit beiden Händen nach oben. Verlasse dich nicht nur auf die Arme und wirf den Ball nicht nach hinten.' },
  },
  {
    image: '/media/movements/wall-ball/correct-target.jpeg',
    title: { pt: '4. Acerte o alvo correto', en: '4. Hit the correct target', de: '4. Das richtige Ziel treffen' },
    description: { pt: 'A bola precisa atingir a zona válida: 2,70 m para Women Open e Women Pro; 3,00 m para Men Open e Men Pro. Mantenha os olhos no alvo e lance para cima e à frente, sem ultrapassar lateralmente a zona.', en: 'The ball must hit the valid target zone: 2.70 m for Women Open and Women Pro; 3.00 m for Men Open and Men Pro. Keep your eyes on the target and throw upward and forward without missing the zone laterally.', de: 'Der Ball muss die gültige Zielzone treffen: 2,70 m für Women Open und Women Pro; 3,00 m für Men Open und Men Pro. Behalte das Ziel im Blick und wirf nach oben und vorn, ohne die Zone seitlich zu verfehlen.' },
  },
  {
    image: '/media/movements/wall-ball/catch-and-repeat.jpeg',
    title: { pt: '5. Receba, absorva e repita', en: '5. Catch, absorb and repeat', de: '5. Auffangen, abfedern und wiederholen' },
    description: { pt: 'Receba a bola suavemente junto ao peito, absorva a descida e conecte o próximo agachamento sob controle. Se a bola tocar o chão, fique totalmente ereto antes de reiniciar; não receba a bola após o quique e continue diretamente.', en: 'Catch the ball softly at the chest, absorb its descent and connect the next squat under control. If the ball touches the floor, stand fully upright before restarting; do not catch it after the bounce and continue directly.', de: 'Fange den Ball weich an der Brust auf, federe seine Abwärtsbewegung ab und leite kontrolliert die nächste Kniebeuge ein. Berührt der Ball den Boden, richte dich vollständig auf, bevor du neu startest; fange ihn nicht nach dem Aufprall auf und mache direkt weiter.' },
  },
  {
    image: '/media/movements/wall-ball/common-no-reps.jpeg',
    title: { pt: '6. Evite repetições inválidas', en: '6. Avoid no-reps', de: '6. Vermeide ungültige Wiederholungen' },
    description: { pt: 'A repetição pode ser invalidada por agachamento raso, bola que não acerta o alvo, impacto fora da zona, início sem extensão completa, joelhos colapsando para dentro ou continuação direta depois de receber a bola após um quique.', en: 'A repetition may be invalidated by a shallow squat, missing the target, striking outside the zone, starting without full extension, knees collapsing inward or continuing directly after catching the ball following a bounce.', de: 'Eine Wiederholung kann ungültig werden durch eine zu flache Kniebeuge, ein verfehltes Ziel, einen Treffer außerhalb der Zone, einen Start ohne vollständige Streckung, nach innen einknickende Knie oder direktes Weitermachen nach einem Ball, der zuvor aufgeprallt ist.' },
  },
];

const sledPushCards: MovementCard[] = [
  {
    image: '/media/movements/sled-push/low-drive-position.jpeg',
    title: { pt: '1. Postura baixa e em bloco', en: '1. Low, unified push position', de: '1. Tiefe, geschlossene Schiebeposition' },
    description: { pt: 'Apoie as mãos nos suportes do trenó, braços quase estendidos, e incline o tronco para a frente como um bloco único, alinhado da cabeça aos calcanhares. Empurre com as pernas, não com a lombar.', en: 'Place your hands on the sled posts with arms nearly extended, and lean your torso forward as one solid unit, aligned from head to heels. Drive with your legs, not your lower back.', de: 'Lege die Hände an die Schlittenstangen, die Arme fast gestreckt, und neige den Oberkörper als eine geschlossene Einheit nach vorn, von Kopf bis Ferse ausgerichtet. Drücke mit den Beinen, nicht mit dem unteren Rücken.' },
  },
];

const sledPullCards: MovementCard[] = [
  {
    image: '/media/movements/sled-pull/front-position.jpeg',
    title: { pt: '1. Posição de frente', en: '1. Front-facing position', de: '1. Frontale Position' },
    description: { pt: 'Fique de frente para o trenó, com os pés estáveis, quadril ligeiramente para trás e joelhos moderadamente flexionados. Mantenha o peito aberto e a coluna neutra.', en: 'Face the sled with stable feet, hips slightly back and knees moderately bent. Keep your chest open and spine neutral.', de: 'Stelle dich mit dem Gesicht zum Schlitten, mit stabilen Füßen, leicht nach hinten geschobener Hüfte und moderat gebeugten Knien. Halte die Brust offen und die Wirbelsäule neutral.' },
  },
  {
    image: '/media/movements/sled-pull/side-position.jpeg',
    title: { pt: '2. Alternativa lateral', en: '2. Side-facing alternative', de: '2. Seitliche Alternative' },
    description: { pt: 'A posição lateral também pode ser usada. Alterne os lados periodicamente, mantenha o tronco firme e evite girar excessivamente a coluna durante a puxada.', en: 'A side-facing position may also be used. Change sides periodically, keep your trunk braced and avoid excessive spinal rotation while pulling.', de: 'Auch eine seitliche Position ist möglich. Wechsle regelmäßig die Seite, halte den Rumpf stabil und vermeide eine übermäßige Rotation der Wirbelsäule während des Zugs.' },
  },
  {
    image: '/media/movements/sled-pull/hand-over-hand.jpeg',
    title: { pt: '3. Puxada mão sobre mão', en: '3. Hand-over-hand pull', de: '3. Hand-über-Hand-Zug' },
    description: { pt: 'Estenda uma mão, segure a corda e puxe em direção ao quadril enquanto a outra mão avança. Mantenha tensão contínua e use um ritmo constante.', en: 'Reach with one hand, grip the rope and pull it toward your hip as the other hand advances. Maintain continuous tension and a steady rhythm.', de: 'Strecke eine Hand aus, greife das Seil und ziehe es in Richtung Hüfte, während die andere Hand nach vorn greift. Halte die Spannung durchgehend und arbeite in einem gleichmäßigen Rhythmus.' },
  },
  {
    image: '/media/movements/sled-pull/finish-rope.jpeg',
    title: { pt: '4. Finalização e corda', en: '4. Finish and rope management', de: '4. Abschluss und Seilmanagement' },
    description: { pt: 'Continue até o trenó completar a distância necessária. Mantenha a corda organizada ao lado do corpo e os pés fora das voltas para reduzir o risco de tropeço.', en: 'Continue until the sled completes the required distance. Keep the rope organized beside your body and your feet clear of the coils to reduce trip risk.', de: 'Mache weiter, bis der Schlitten die erforderliche Strecke zurückgelegt hat. Halte das Seil geordnet neben dem Körper und die Füße frei von den Schlaufen, um Stolpergefahr zu vermeiden.' },
  },
  {
    image: '/media/movements/sled-pull/common-mistakes.jpeg',
    title: { pt: '5. Evite estes erros', en: '5. Avoid these mistakes', de: '5. Vermeide diese Fehler' },
    description: { pt: 'Não fique totalmente ereto, não sente em um agachamento profundo e não pise sobre a corda. Use uma flexão moderada dos joelhos e preserve uma base firme.', en: 'Do not stand completely upright, sit into a deep squat or step on the rope. Use moderate knee bend and maintain a stable base.', de: 'Stehe nicht komplett aufrecht, setze dich nicht in eine tiefe Kniebeuge und trete nicht auf das Seil. Nutze eine moderate Kniebeugung und halte eine stabile Basis.' },
  },
];

const burpeeBroadJumpCards: MovementCard[] = [
  {
    image: '/media/movements/burpee-broad-jump/chest-to-floor.jpeg',
    title: { pt: '1. Peito claramente no chão', en: '1. Chest clearly on the floor', de: '1. Brust deutlich am Boden' },
    description: { pt: 'Na primeira repetição, coloque as mãos atrás da linha de largada. Salte ou caminhe com os pés para trás e desça até o peito tocar claramente o chão.', en: 'For the first repetition, place your hands behind the start line. Jump or step the feet back and lower until the chest clearly touches the floor.', de: 'Setze bei der ersten Wiederholung die Hände hinter der Startlinie auf. Springe oder gehe mit den Füßen nach hinten und senke dich ab, bis die Brust den Boden deutlich berührt.' },
  },
  {
    image: '/media/movements/burpee-broad-jump/feet-forward.jpeg',
    title: { pt: '2. Levante e prepare a impulsão', en: '2. Rise and prepare to take off', de: '2. Aufstehen und den Absprung vorbereiten' },
    description: { pt: 'Saia do chão saltando ou caminhando com os pés para a frente. Ao levantar, os pés não podem ultrapassar a ponta dos dedos das mãos. Estabilize os dois pés paralelos.', en: 'Rise by jumping or stepping the feet forward. When coming up, the feet must not pass beyond the fingertips. Stabilize with both feet parallel.', de: 'Steh auf, indem du springst oder die Füße nach vorn führst. Beim Hochkommen dürfen die Füße nicht über die Fingerspitzen hinausgehen. Stabilisiere dich mit parallel stehenden Füßen.' },
  },
  {
    image: '/media/movements/burpee-broad-jump/forward-flight.jpeg',
    title: { pt: '3. Salto horizontal com dois pés', en: '3. Two-foot horizontal jump', de: '3. Horizontaler Sprung mit beiden Füßen' },
    description: { pt: 'Impulsione os dois pés paralelos ao mesmo tempo e salte para a frente, não apenas para cima. A distância de cada salto é livre, desde que a técnica permaneça válida.', en: 'Take off from two parallel feet at the same time and jump forward, not merely upward. Each jump distance is your choice, provided the technique remains valid.', de: 'Springe gleichzeitig von beiden parallelen Füßen ab und springe nach vorn, nicht nur nach oben. Die Sprungweite ist dir überlassen, solange die Technik gültig bleibt.' },
  },
  {
    image: '/media/movements/burpee-broad-jump/landing-beyond-line.png',
    title: { pt: '4. Aterrisse e inicie o próximo burpee', en: '4. Land and begin the next burpee', de: '4. Landen und den nächsten Burpee starten' },
    description: { pt: 'Aterrisse simultaneamente nos dois pés paralelos, flexionando quadris e joelhos. Sem passos ou arrastes, coloque as mãos no máximo 30 cm à frente dos dedos dos pés e execute o próximo burpee. Repita até completar 80 m.', en: 'Land simultaneously on two parallel feet, bending the hips and knees. Without stepping or shuffling, place the hands no more than 30 cm in front of the toes and perform the next burpee. Repeat until completing 80 m.', de: 'Lande gleichzeitig auf beiden parallelen Füßen und beuge dabei Hüfte und Knie. Setze ohne zusätzliche Schritte oder Schlurfen die Hände maximal 30 cm vor den Zehen auf und führe den nächsten Burpee aus. Wiederhole dies, bis 80 m zurückgelegt sind.' },
  },
];

const runningTransitionCards: MovementCard[] = [
  {
    image: '/media/movements/running-transitions/structure.jpeg',
    title: { pt: '1. Estrutura da corrida — 8 × 1 km', en: '1. Running Structure — 8 × 1 km', de: '1. Laufstruktur — 8 × 1 km' },
    description: {
      pt: 'A prova alterna 1 km de corrida com uma estação, oito vezes: 8 km e oito estações no total. Siga a ordem oficial e mantenha o chip preso ao tornozelo.',
      en: 'The race alternates a 1 km run with one workout station eight times: 8 km and eight stations in total. Follow the official order and keep the timing chip secured to your ankle.',
      de: 'Das Rennen wechselt achtmal zwischen 1 km Laufen und einer Station: insgesamt 8 km und acht Stationen. Halte dich an die offizielle Reihenfolge und lasse den Zeitmesschip am Knöchel befestigt.',
    },
  },
  {
    image: '/media/movements/running-transitions/technique.jpeg',
    title: { pt: '2. Técnica eficiente de corrida', en: '2. Efficient Running Technique', de: '2. Effiziente Lauftechnik' },
    description: {
      pt: 'Cabeça neutra, ombros relaxados, cotovelos impulsionando para trás, leve inclinação à frente e passadas rápidas aterrissando sob o corpo.',
      en: 'Keep a neutral head, relaxed shoulders, elbows driving back, a slight forward lean and quick steps landing beneath the body.',
      de: 'Halte den Kopf neutral, die Schultern locker, treibe die Ellbogen nach hinten, neige dich leicht nach vorn und setze mit schnellen Schritten unter dem Körper auf.',
    },
  },
  {
    image: '/media/movements/running-transitions/pacing-breathing.jpeg',
    title: { pt: '3. Controle o ritmo e a respiração', en: '3. Pace and Breathe with Control', de: '3. Tempo und Atmung kontrollieren' },
    description: {
      pt: 'Comece controlado, mantenha ritmo e respiração sustentáveis no meio da prova e aumente apenas quando técnica e respiração permanecerem estáveis.',
      en: 'Start controlled, maintain a sustainable rhythm and breathing pattern through the middle, and increase effort only while technique and breathing remain stable.',
      de: 'Starte kontrolliert, halte im mittleren Teil ein nachhaltiges Tempo und eine gleichmäßige Atmung und steigere das Tempo nur, solange Technik und Atmung stabil bleiben.',
    },
  },
  {
    image: '/media/movements/running-transitions/transitions.jpeg',
    title: { pt: '4. Transições rápidas e controladas', en: '4. Fast and Controlled Transitions', de: '4. Schnelle, kontrollierte Übergänge' },
    description: {
      pt: 'Identifique a entrada, reduza gradualmente, siga a rota IN, conclua o padrão e saia pela rota OUT, retomando o ritmo progressivamente.',
      en: 'Identify the entrance, slow gradually, follow the IN route, complete the standard and leave through OUT, rebuilding running pace progressively.',
      de: 'Erkenne den Eingang, verlangsame dich schrittweise, folge der IN-Route, absolviere die Station und verlasse sie über die OUT-Route, während du das Lauftempo allmählich wieder aufbaust.',
    },
  },
  {
    image: '/media/movements/running-transitions/common-mistakes.jpeg',
    title: { pt: '5. Erros comuns na corrida e nas transições', en: '5. Common Running and Transition Mistakes', de: '5. Häufige Fehler beim Laufen und bei Übergängen' },
    description: {
      pt: 'Evite largar rápido demais, alongar excessivamente a passada, tensionar os ombros, frear bruscamente, errar a rota ou acelerar cedo demais na saída.',
      en: 'Avoid starting too fast, overstriding, tense shoulders, abrupt braking, using the wrong route or accelerating too aggressively after a station.',
      de: 'Vermeide einen zu schnellen Start, übermäßig lange Schritte, verspannte Schultern, abruptes Abbremsen, die falsche Route oder ein zu aggressives Beschleunigen nach einer Station.',
    },
  },
];

const movementEnglish: Record<string, Pick<Movement, 'name' | 'category' | 'equipment' | 'level' | 'objective' | 'steps' | 'attention'>> = {
  skierg: { name: 'SkiErg', category: 'Station', equipment: 'SkiErg', level: 'All levels', objective: 'Develop power and endurance by coordinating the legs, core and arms.', steps: ['Start tall with your arms extended and core braced.', 'Drive the handles down using your hips, core and arms.', 'Return under control and establish a sustainable rhythm.'], attention: ['Avoid relying only on your arms.', 'Keep your spine organized and your feet stable.'] },
  'sled-push': { name: 'Sled push', category: 'Station', equipment: 'Sled and track', level: 'Intermediate', objective: 'Produce horizontal force while maintaining consistent forward movement.', steps: ['Place your hands on the sled and lean forward as one solid unit.', 'Use short, continuous steps.', 'Adjust the load to preserve posture and steady progress.'], attention: ['Do not let your hips rise excessively.', 'Reduce the load if you lose spinal control.'] },
  'sled-pull': { name: 'Sled pull', category: 'Station', equipment: 'Sled and rope', level: 'Intermediate', objective: 'Combine pulling strength, stability and efficient movement.', steps: ['Keep constant tension on the rope.', 'Pull hand over hand while stepping back under control.', 'Organize the rope to avoid interruptions.'], attention: ['Keep your feet clear of the rope.', 'Avoid sudden pulls without a stable base.'] },
  burpee: { name: 'Burpee broad jump', category: 'Station', equipment: '80 m marked lane', level: 'All levels', objective: 'Cover 80 meters by linking a chest-to-floor burpee with a two-foot broad jump.', steps: ['Place the hands down, jump or step back, and make clear chest contact with the floor.', 'Jump or step the feet forward without passing the fingertips; rise with the feet parallel.', 'Take off from both feet together and jump horizontally.', 'Land on both feet together, absorb the impact, and begin the next burpee from that landing spot.'], attention: ['No staggered takeoff or landing, additional steps, or foot shuffling.', 'For the next repetition, place the hands no more than 30 cm in front of the toes and do not move them farther forward once planted.', 'At the finish, both feet must land completely beyond the line.'] },
  rowing: { name: 'Rowing ergometer', category: 'Station', equipment: 'Rower', level: 'All levels', objective: 'Build cyclical power and cardiorespiratory efficiency.', steps: ['Start with bent legs and extended arms.', 'Drive with the legs, open the torso and finish with the arms.', 'Return arms first, then torso, then legs.'], attention: ['Do not begin the arm pull too early.', 'Avoid excessive rounding of the lower back.'] },
  farmers: { name: "Farmer's carry", category: 'Station', equipment: 'Kettlebells or dumbbells', level: 'All levels', objective: 'Develop grip, core stability and loaded-carry capacity.', steps: ['Hold the weights close to your body.', 'Walk tall with controlled steps.', 'Turn without losing stability.'], attention: ['Avoid leaning your torso sideways.', 'Choose a load that lets you walk under control.'] },
  lunges: { name: 'Sandbag lunges', category: 'Station', equipment: 'Sandbag', level: 'Intermediate', objective: 'Strengthen the legs and stability while moving under load.', steps: ['Position the sandbag securely.', 'Step forward and lower under control.', 'Push the floor away and continue by alternating legs.'], attention: ['Keep the knee aligned with the foot.', 'Slow down if your posture begins to change.'] },
  'wall-ball': { name: 'Wall ball', category: 'Station', equipment: 'Ball and target', level: 'All levels', objective: 'Coordinate the squat, extension and throw through consistent repetitions.', steps: ['Receive the ball at your chest and begin the squat.', 'Extend the legs and hips to drive the throw.', 'Catch under control and connect the next repetition.'], attention: ['Use your legs to generate momentum.', 'Keep your eyes on the target and control the catch.'] },
  transitions: { name: 'Running and transitions', category: 'Running', equipment: 'Track or course', level: 'All levels', objective: 'Manage pace and transitions between running and stations without unnecessary spikes.', steps: ['Build into the run progressively.', 'Use the first meters to reset breathing and posture.', 'Prepare for the next station before arriving.'], attention: ['Avoid leaving a station at an unsustainable speed.', 'Monitor pace, breathing and course direction.'] },
};

const movementGerman: Record<string, Pick<Movement, 'name' | 'category' | 'equipment' | 'level' | 'objective' | 'steps' | 'attention'>> = {
  skierg: { name: 'SkiErg', category: 'Station', equipment: 'SkiErg', level: 'Alle Levels', objective: 'Kraft und Ausdauer entwickeln, indem Beine, Rumpf und Arme koordiniert eingesetzt werden.', steps: ['Starte aufrecht mit gestreckten Armen und angespanntem Rumpf.', 'Ziehe die Griffe mit Hüfte, Rumpf und Armen nach unten.', 'Kehre kontrolliert zurück und finde einen nachhaltigen Rhythmus.'], attention: ['Verlasse dich nicht nur auf die Arme.', 'Halte die Wirbelsäule organisiert und die Füße stabil.'] },
  'sled-push': { name: 'Sled Push', category: 'Station', equipment: 'Schlitten und Bahn', level: 'Fortgeschritten', objective: 'Horizontale Kraft erzeugen und dabei eine gleichmäßige Vorwärtsbewegung beibehalten.', steps: ['Lege die Hände auf den Schlitten und lehne dich als eine feste Einheit nach vorn.', 'Mache kurze, kontinuierliche Schritte.', 'Passe die Last an, um Haltung und stetigen Fortschritt zu bewahren.'], attention: ['Lass die Hüfte nicht übermäßig ansteigen.', 'Reduziere die Last, wenn du die Kontrolle über die Wirbelsäule verlierst.'] },
  'sled-pull': { name: 'Sled Pull', category: 'Station', equipment: 'Schlitten und Seil', level: 'Fortgeschritten', objective: 'Zugkraft, Stabilität und effiziente Bewegung kombinieren.', steps: ['Halte konstante Spannung auf dem Seil.', 'Ziehe Hand über Hand, während du kontrolliert rückwärtsgehst.', 'Halte das Seil geordnet, um Unterbrechungen zu vermeiden.'], attention: ['Halte die Füße frei vom Seil.', 'Vermeide ruckartige Züge ohne stabile Basis.'] },
  burpee: { name: 'Burpee Broad Jump', category: 'Station', equipment: 'Markierte 80-m-Bahn', level: 'Alle Levels', objective: '80 Meter zurücklegen, indem ein Burpee mit Brustkontakt am Boden mit einem beidbeinigen Weitsprung verbunden wird.', steps: ['Setze die Hände auf, springe oder gehe mit den Füßen nach hinten und berühre den Boden deutlich mit der Brust.', 'Springe oder gehe mit den Füßen nach vorn, ohne die Fingerspitzen zu überschreiten; steh mit parallelen Füßen auf.', 'Springe gleichzeitig von beiden Füßen ab und springe horizontal.', 'Lande gleichzeitig auf beiden Füßen, federe den Aufprall ab und beginne den nächsten Burpee an der Landestelle.'], attention: ['Kein versetzter Absprung oder Landung, keine zusätzlichen Schritte oder Schlurfen.', 'Setze bei der nächsten Wiederholung die Hände maximal 30 cm vor den Zehen auf und bewege sie danach nicht weiter nach vorn.', 'Im Ziel müssen beide Füße vollständig hinter der Linie landen.'] },
  rowing: { name: 'Rudergerät', category: 'Station', equipment: 'Rudergerät', level: 'Alle Levels', objective: 'Zyklische Kraft und kardiorespiratorische Effizienz aufbauen.', steps: ['Starte mit gebeugten Beinen und gestreckten Armen.', 'Drücke mit den Beinen, öffne den Oberkörper und beende mit den Armen.', 'Kehre zurück mit Armen, dann Oberkörper, dann Beinen.'], attention: ['Beginne den Armzug nicht zu früh.', 'Vermeide ein übermäßiges Runden des unteren Rückens.'] },
  farmers: { name: 'Farmer’s Carry', category: 'Station', equipment: 'Kettlebells oder Kurzhanteln', level: 'Alle Levels', objective: 'Griffkraft, Rumpfstabilität und die Fähigkeit zum belasteten Tragen entwickeln.', steps: ['Halte die Gewichte nah am Körper.', 'Gehe aufrecht mit kontrollierten Schritten.', 'Drehe, ohne die Stabilität zu verlieren.'], attention: ['Neige den Oberkörper nicht seitlich.', 'Wähle eine Last, mit der du kontrolliert gehen kannst.'] },
  lunges: { name: 'Sandbag Lunges', category: 'Station', equipment: 'Sandbag', level: 'Fortgeschritten', objective: 'Beine und Stabilität unter Last während der Fortbewegung stärken.', steps: ['Positioniere den Sandbag sicher.', 'Schreite nach vorn und senke dich kontrolliert ab.', 'Drücke dich vom Boden ab und mache weiter, indem du die Beine wechselst.'], attention: ['Halte das Knie in Linie mit dem Fuß.', 'Verlangsame das Tempo, wenn sich deine Haltung verändert.'] },
  'wall-ball': { name: 'Wall Ball', category: 'Station', equipment: 'Ball und Ziel', level: 'Alle Levels', objective: 'Kniebeuge, Streckung und Wurf durch gleichmäßige Wiederholungen koordinieren.', steps: ['Nimm den Ball an der Brust auf und beginne die Kniebeuge.', 'Strecke Beine und Hüfte, um den Wurf anzutreiben.', 'Fange den Ball kontrolliert auf und leite die nächste Wiederholung ein.'], attention: ['Nutze deine Beine, um Schwung zu erzeugen.', 'Behalte das Ziel im Blick und kontrolliere das Auffangen.'] },
  transitions: { name: 'Laufen und Übergänge', category: 'Laufen', equipment: 'Bahn oder Strecke', level: 'Alle Levels', objective: 'Tempo und Übergänge zwischen Laufen und Stationen ohne unnötige Spitzen steuern.', steps: ['Steigere dich progressiv in den Lauf.', 'Nutze die ersten Meter, um Atmung und Haltung neu zu ordnen.', 'Bereite dich auf die nächste Station vor, bevor du ankommst.'], attention: ['Verlasse eine Station nicht mit einem nicht durchhaltbaren Tempo.', 'Beobachte Tempo, Atmung und Streckenführung.'] },
};

const localizedMovement = (movement: Movement, lang: 'pt' | 'en' | 'de'): Movement => lang === 'en' ? { ...movement, ...movementEnglish[movement.id] } : lang === 'de' ? { ...movement, ...movementGerman[movement.id] } : movement;

const movements: Movement[] = [
  { id: 'skierg', name: 'SkiErg', category: 'Estação', equipment: 'SkiErg', level: 'Todos os níveis', objective: 'Desenvolver potência e resistência usando pernas, tronco e braços de forma coordenada.', steps: ['Comece alto, com braços estendidos e tronco firme.', 'Conduza os puxadores para baixo usando quadril, abdômen e braços.', 'Retorne com controle e estabeleça um ritmo sustentável.'], attention: ['Evite depender somente dos braços.', 'Mantenha a coluna organizada e os pés estáveis.'], accent: 'from-sky-500/25', videoUrl: '/media/movements/skierg/demonstration.mp4', cards: skiErgCards },
  { id: 'sled-push', name: 'Empurrar trenó', category: 'Estação', equipment: 'Trenó e pista', level: 'Intermediário', objective: 'Produzir força horizontal mantendo deslocamento consistente.', steps: ['Apoie as mãos e incline o corpo em bloco.', 'Use passos curtos e contínuos.', 'Ajuste a carga para preservar postura e progressão.'], attention: ['Não deixe o quadril subir excessivamente.', 'Reduza a carga se perder o controle da coluna.'], accent: 'from-orange-500/30', videoUrl: '/media/sled-push-technique.mp4', cards: sledPushCards },
  { id: 'sled-pull', name: 'Puxar trenó', category: 'Estação', equipment: 'Trenó e corda', level: 'Intermediário', objective: 'Combinar força de puxada, estabilidade e deslocamento eficiente.', steps: ['Mantenha tensão constante na corda.', 'Puxe alternando as mãos e recue de forma controlada.', 'Organize a corda para evitar interrupções.'], attention: ['Mantenha os pés fora da trajetória da corda.', 'Evite puxões bruscos sem base estável.'], accent: 'from-amber-500/25', cards: sledPullCards },
  { id: 'burpee', name: 'Burpee com salto em distância', category: 'Estação', equipment: 'Pista demarcada de 80 m', level: 'Todos os níveis', objective: 'Percorrer 80 metros conectando um burpee com peito no chão a um salto horizontal com os dois pés.', steps: ['Apoie as mãos, salte ou caminhe para trás e encoste claramente o peito no chão.', 'Salte ou caminhe com os pés para a frente sem ultrapassar os dedos das mãos; levante com os pés paralelos.', 'Impulsione os dois pés juntos e salte horizontalmente.', 'Aterrisse com os dois pés juntos, absorva o impacto e inicie o próximo burpee no ponto da queda.'], attention: ['Não alterne os pés na impulsão ou aterrissagem, nem dê passos ou arraste os pés.', 'Na repetição seguinte, coloque as mãos no máximo 30 cm à frente dos dedos dos pés e não as avance depois de apoiadas.', 'Na chegada, os dois pés devem ultrapassar completamente a linha.'], accent: 'from-yellow-500/25', videoUrl: '/media/movements/burpee-broad-jump/demonstration.mp4', cards: burpeeBroadJumpCards },
  { id: 'rowing', name: 'Remo ergométrico', category: 'Estação', equipment: 'Remo', level: 'Todos os níveis', objective: 'Construir potência cíclica e eficiência cardiorrespiratória.', steps: ['Inicie com pernas flexionadas e braços estendidos.', 'Empurre com as pernas, abra o tronco e finalize com os braços.', 'Retorne braços, tronco e depois pernas.'], attention: ['Não antecipe a puxada dos braços.', 'Evite arredondar excessivamente a lombar.'], accent: 'from-cyan-500/25', videoUrl: '/media/movements/rowerg/demonstration.mp4', cards: rowErgCards },
  { id: 'farmers', name: 'Caminhada do fazendeiro', category: 'Estação', equipment: 'Kettlebells ou halteres', level: 'Todos os níveis', objective: 'Desenvolver pegada, estabilidade do tronco e capacidade de transportar carga.', steps: ['Segure as cargas junto ao corpo.', 'Caminhe com postura alta e passos controlados.', 'Faça a volta sem perder estabilidade.'], attention: ['Evite inclinar o tronco lateralmente.', 'Escolha uma carga que permita caminhar com controle.'], accent: 'from-violet-500/25', videoUrl: '/media/movements/farmers-carry/demonstration.mp4', cards: farmersCarryCards },
  { id: 'lunges', name: 'Afundo com sandbag', category: 'Estação', equipment: 'Sandbag', level: 'Intermediário', objective: 'Fortalecer pernas e estabilidade sob carga durante o deslocamento.', steps: ['Posicione o sandbag atravessado sobre os dois ombros.', 'Avance e toque claramente o joelho traseiro no chão.', 'Fique totalmente ereto e avance alternando as pernas.'], attention: ['Não dê passos extras entre as repetições.', 'Mantenha o sandbag sobre os dois ombros até concluir a estação.'], accent: 'from-red-500/25', cards: sandbagLungeCards },
  { id: 'wall-ball', name: 'Wall ball', category: 'Estação', equipment: 'Bola e alvo', level: 'Todos os níveis', objective: 'Coordenar agachamento, extensão e lançamento em repetições consistentes.', steps: ['Receba a bola junto ao peito e inicie o agachamento.', 'Estenda pernas e quadril para impulsionar o lançamento.', 'Receba a bola com controle e conecte a repetição seguinte.'], attention: ['Use as pernas para gerar impulso.', 'Mantenha o olhar no alvo e controle a recepção.'], accent: 'from-rose-500/25', cards: wallBallCards },
  { id: 'transitions', name: 'Corrida e transições', category: 'Corrida', equipment: 'Pista ou percurso', level: 'Todos os níveis', objective: 'Organizar ritmo e passagem entre corrida e estações sem picos desnecessários.', steps: ['Entre na corrida de forma progressiva.', 'Use os primeiros metros para reorganizar respiração e postura.', 'Antecipe a entrada na estação seguinte.'], attention: ['Evite sair da estação em velocidade insustentável.', 'Observe ritmo, respiração e orientação do percurso.'], accent: 'from-emerald-500/25', cards: runningTransitionCards },
];

export default function MovementLibrary() {
  const { lang } = useI18n();
  const en = lang === 'en';
  const tr = (pt: string, english: string, german: string) => en ? english : lang === 'de' ? german : pt;
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('Todos'); const [selected, setSelected] = useState<Movement | null>(null);
  const categories = ['Todos', ...new Set(movements.map(item => item.category))];
  const filtered = useMemo(() => movements.filter(item => {
    const display = localizedMovement(item, lang);
    return (category === 'Todos' || item.category === category) && `${display.name} ${display.equipment}`.toLowerCase().includes(query.toLowerCase());
  }), [query, category, lang]);
  return <div className="min-h-screen bg-[#090909] px-4 py-10 text-white"><main className="container">
    <header className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-500">{tr('Aprenda antes de executar', 'Learn before you perform', 'Lerne, bevor du trainierst')}</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{tr('Biblioteca de movimentos', 'Movement library', 'Bewegungsbibliothek')}</h1><p className="mt-3 text-zinc-400">{tr('Consulte o objetivo, a organização geral do movimento e pontos de atenção das principais estações do fitness racing.', 'Review the goal, general setup and key points for the main fitness racing movements.', 'Sieh dir Ziel, allgemeinen Bewegungsablauf und wichtige Hinweise zu den zentralen Fitness-Racing-Stationen an.')}</p></header>
    <section className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111] p-4 md:flex-row md:items-center"><label className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3"><Search className="h-4 w-4 text-zinc-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={tr('Buscar movimento ou equipamento', 'Search movement or equipment', 'Bewegung oder Ausrüstung suchen')} className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" /></label><div className="flex flex-wrap gap-2">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${category === item ? 'border-orange-500 bg-orange-500 text-black' : 'border-white/10 text-zinc-400 hover:border-orange-500/30'}`}>{item === 'Todos' ? tr('Todos', 'All', 'Alle') : item === 'Estação' ? tr('Estação', 'Station', 'Station') : tr('Corrida', 'Running', 'Laufen')}</button>)}</div></section>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(source => { const item = localizedMovement(source, lang); return <button key={item.id} onClick={() => setSelected(source)} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111] text-left transition hover:-translate-y-1 hover:border-orange-500/35"><div className={`relative grid h-40 place-items-center bg-gradient-to-br ${item.accent} to-[#101010]`}><Activity className="h-14 w-14 text-white/15 transition group-hover:scale-110 group-hover:text-orange-400/30" /><span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/30"><CirclePlay className="h-5 w-5" /></span><span className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300">{item.category}</span></div><div className="p-5"><h2 className="text-lg font-black">{item.name}</h2><p className="mt-1 text-xs text-zinc-500">{item.equipment} · {item.level}</p><p className="mt-4 line-clamp-2 text-sm leading-relaxed text-zinc-400">{item.objective}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-orange-400">{tr('Abrir guia', 'Open guide', 'Anleitung öffnen')} <ArrowRight className="h-3.5 w-3.5" /></span></div></button> })}</section>
    {filtered.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center text-zinc-500">{tr('Nenhum movimento encontrado.', 'No movements found.', 'Keine Bewegung gefunden.')}</div>}
  </main>{selected && <MovementModal movement={selected} onClose={() => setSelected(null)} />}</div>;
}

function MovementModal({ movement, onClose }: { movement: Movement; onClose: () => void }) {
  const { lang } = useI18n(); const en = lang === 'en'; const tr = (pt: string, english: string, german: string) => en ? english : lang === 'de' ? german : pt; const item = localizedMovement(movement, lang);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <article className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
      <div className={`relative grid min-h-56 place-items-center overflow-hidden bg-gradient-to-br ${item.accent} to-[#101010]`}>
        {item.videoUrl ? <video src={item.videoUrl} controls playsInline preload="metadata" className="max-h-[60vh] w-full bg-black object-contain" /> : <><Video className="h-20 w-20 text-white/15" /><div className="absolute bottom-5 left-5"><p className="text-xs font-bold uppercase tracking-wider text-orange-400">{tr('Guia do movimento', 'Movement guide', 'Bewegungsanleitung')}</p><h2 className="mt-1 text-3xl font-black">{item.name}</h2></div></>}
        <button onClick={onClose} aria-label={tr('Fechar', 'Close', 'Schließen')} className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/60 p-2 text-zinc-300 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
      <div className="p-6 md:p-8">
        <div className="grid gap-3 sm:grid-cols-3"><Mini icon={Dumbbell} label={tr('Equipamento', 'Equipment', 'Ausrüstung')} value={item.equipment} /><Mini icon={Gauge} label={tr('Nível', 'Level', 'Level')} value={item.level} /><Mini icon={Activity} label={tr('Categoria', 'Category', 'Kategorie')} value={item.category} /></div>
        <section className="mt-7"><h3 className="font-black">{tr('Objetivo', 'Objective', 'Ziel')}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.objective}</p></section>
        {item.cards && <section className="mt-8"><h3 className="text-xl font-black">{tr('Sequência técnica', 'Technical sequence', 'Technische Abfolge')}</h3><div className="mt-4 space-y-5">{item.cards.map(card => <figure key={card.image} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"><img src={card.image} alt={lang === 'en' ? card.title.en : lang === 'de' ? card.title.de : card.title.pt} loading="lazy" className="aspect-video w-full object-cover" /><figcaption className="p-5"><h4 className="font-black text-white">{lang === 'en' ? card.title.en : lang === 'de' ? card.title.de : card.title.pt}</h4><p className="mt-2 text-sm leading-relaxed text-zinc-400">{lang === 'en' ? card.description.en : lang === 'de' ? card.description.de : card.description.pt}</p></figcaption></figure>)}</div></section>}
        <div className="mt-7 grid gap-6 md:grid-cols-2"><section><h3 className="font-black">{tr('Organização do movimento', 'Movement setup', 'Bewegungsablauf')}</h3><ol className="mt-3 space-y-3">{item.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-relaxed text-zinc-400"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-500/15 text-xs font-black text-orange-400">{index + 1}</span>{step}</li>)}</ol></section><section><h3 className="flex items-center gap-2 font-black"><Info className="h-4 w-4 text-orange-500" /> {tr('Pontos de atenção', 'Key points', 'Wichtige Hinweise')}</h3><ul className="mt-3 space-y-3">{item.attention.map(point => <li key={point} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-relaxed text-zinc-400">{point}</li>)}</ul></section></div>
        <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-relaxed text-zinc-600">{tr('Use este guia como referência geral. Ajuste carga, amplitude e ritmo às suas condições e interrompa a atividade se sentir dor ou mal-estar.', 'Use this guide as a general reference. Adjust load, range of motion and pace to your condition, and stop if you feel pain or discomfort.', 'Nutze diese Anleitung als allgemeine Referenz. Passe Last, Bewegungsumfang und Tempo an deine Verfassung an und breche die Aktivität ab, wenn du Schmerzen oder Unwohlsein verspürst.')}</p>
      </div>
    </article>
  </div>;
}
function Mini({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-black/20 p-4"><Icon className="h-4 w-4 text-orange-500" /><p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-600">{label}</p><p className="mt-1 text-sm font-bold text-zinc-300">{value}</p></div>; }
