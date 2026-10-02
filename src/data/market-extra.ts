import type { Position } from "./squads";

/** Jogadores adicionados pelo usuário ao mercado (valor, clube, nacionalidade e estilo informados por ele). */
export interface ExtraMarketPlayer { name: string; position: Position; value: number; club: string; nationality: string; traits: string; league: string; age?: number; overall?: number; expectedWage?: number }

export const EXTRA_MARKET: ExtraMarketPlayer[] = [
 {
  "name": "Justin Kluivert",
  "position": "MAT",
  "value": 25000000,
  "club": "Bournemouth",
  "nationality": "Holanda",
  "traits": "Creative Playmaker",
  "league": "Premier League",
  "age": 27,
  "overall": 81,
  "expectedWage": 128794
 },
 {
  "name": "João Félix",
  "position": "MAT",
  "value": 28000000,
  "club": "Al-Nassr",
  "nationality": "Portugal",
  "traits": "Creative Playmaker",
  "league": "Saudi Pro League",
  "age": 26,
  "overall": 83,
  "expectedWage": 336538
 },
 {
  "name": "Francisco Conceição",
  "position": "PTA",
  "value": 30000000,
  "club": "Juventus",
  "nationality": "Portugal",
  "traits": "Prolific Winger",
  "league": "Serie A",
  "age": 23,
  "overall": 81,
  "expectedWage": 136890
 },
 {
  "name": "Antony",
  "position": "PTA",
  "value": 40000000,
  "club": "Real Betis",
  "nationality": "Brasil",
  "traits": "Prolific Winger",
  "league": "La Liga",
  "age": 26,
  "overall": 81,
  "expectedWage": 120192
 },
 {
  "name": "Ênio",
  "position": "PTA",
  "value": 800000000,
  "club": "Chapecoense",
  "nationality": "Brasil",
  "traits": "Prolific Winger",
  "league": "Brasileirão"
 },
 {
  "name": "Gustavo Scarpa",
  "position": "MAT",
  "value": 8000000,
  "club": "Atlético-MG",
  "nationality": "Brasil",
  "traits": "Creative Playmaker",
  "league": "Brasileirão"
 },
 {
  "name": "Hulk",
  "position": "CA",
  "value": 3000000,
  "club": "Atlético-MG",
  "nationality": "Brasil",
  "traits": "Deep-Lying Forward",
  "league": "Brasileirão"
 },
 {
  "name": "Paulinho",
  "position": "PTA",
  "value": 12000000,
  "club": "Palmeiras",
  "nationality": "Brasil",
  "traits": "Prolific Winger",
  "league": "Brasileirão"
 },
 {
  "name": "Rony",
  "position": "PTA",
  "value": 6000000,
  "club": "Atlético-MG",
  "nationality": "Brasil",
  "traits": "Prolific Winger",
  "league": "Brasileirão"
 },
 {
  "name": "Everton Ribeiro",
  "position": "MAT",
  "value": 2000000,
  "club": "Bahia",
  "nationality": "Brasil",
  "traits": "Creative Playmaker",
  "league": "Brasileirão"
 },
 {
  "name": "Luciano",
  "position": "CA",
  "value": 4000000,
  "club": "São Paulo",
  "nationality": "Brasil",
  "traits": "Deep-Lying Forward",
  "league": "Brasileirão"
 },
 {
  "name": "Lucas Moura",
  "position": "PTA",
  "value": 3000000,
  "club": "São Paulo",
  "nationality": "Brasil",
  "traits": "Prolific Winger",
  "league": "Brasileirão"
 },
 {
  "name": "Calleri",
  "position": "CA",
  "value": 4000000,
  "club": "São Paulo",
  "nationality": "Argentina",
  "traits": "Target Man",
  "league": "Brasileirão"
 },
 {
  "name": "Marcos Antônio",
  "position": "MCT",
  "value": 5000000,
  "club": "São Paulo",
  "nationality": "Brasil",
  "traits": "Orchestrator",
  "league": "Brasileirão"
 },
 {
  "name": "Luiz Gustavo",
  "position": "VOL",
  "value": 1000000,
  "club": "São Paulo",
  "nationality": "Brasil",
  "traits": "Anchor Man",
  "league": "Brasileirão"
 },
 {
  "name": "Rafinha",
  "position": "LAT",
  "value": 1000000,
  "club": "São Paulo",
  "nationality": "Brasil",
  "traits": "Offensive Full-back",
  "league": "Brasileirão"
 },
 {
  "name": "Júnior Santos",
  "position": "PTA",
  "value": 6000000,
  "club": "Atlético-MG",
  "nationality": "Brasil",
  "traits": "Prolific Winger",
  "league": "Brasileirão"
 },
 {
  "name": "Marlon Freitas",
  "position": "VOL",
  "value": 5000000,
  "club": "Botafogo",
  "nationality": "Brasil",
  "traits": "Orchestrator",
  "league": "Brasileirão"
 },
 {
  "name": "Matheus Martins",
  "position": "PTA",
  "value": 8000000,
  "club": "Botafogo",
  "nationality": "Brasil",
  "traits": "Prolific Winger",
  "league": "Brasileirão"
 },
 {
  "name": "Savarino",
  "position": "PTA",
  "value": 7000000,
  "club": "Botafogo",
  "nationality": "Venezuela",
  "traits": "Prolific Winger",
  "league": "Brasileirão"
 },
 {
  "name": "Tiquinho Soares",
  "position": "CA",
  "value": 2000000,
  "club": "Santos",
  "nationality": "Brasil",
  "traits": "Target Man",
  "league": "Brasileirão"
 },
 {
  "name": "Rollheiser",
  "position": "PTA",
  "value": 8000000,
  "club": "Santos",
  "nationality": "Argentina",
  "traits": "Creative Playmaker",
  "league": "Brasileirão"
 },
 {
  "name": "Guilherme",
  "position": "PTA",
  "value": 7000000,
  "club": "Santos",
  "nationality": "Brasil",
  "traits": "Prolific Winger",
  "league": "Brasileirão"
 },
 {
  "name": "Richarlison",
  "position": "CA",
  "value": 28000000,
  "club": "Tottenham",
  "nationality": "Brasil",
  "traits": "Goal Poacher",
  "league": "Brasileirão"
 },
 {
  "name": "Bukayo Saka",
  "position": "PTA",
  "value": 150000000,
  "club": "Arsenal",
  "nationality": "Inglaterra",
  "traits": "Prolific Winger",
  "league": "Premier League"
 },
 {
  "name": "William Saliba",
  "position": "ZAG",
  "value": 90000000,
  "club": "Arsenal",
  "nationality": "França",
  "traits": "Build Up",
  "league": "Premier League"
 },
 {
  "name": "Martin Ødegaard",
  "position": "MAT",
  "value": 90000000,
  "club": "Arsenal",
  "nationality": "Noruega",
  "traits": "Creative Playmaker",
  "league": "Premier League"
 },
 {
  "name": "Alexander Isak",
  "position": "CA",
  "value": 120000000,
  "club": "Newcastle",
  "nationality": "Suécia",
  "traits": "Goal Poacher",
  "league": "Premier League"
 },
 {
  "name": "Anthony Gordon",
  "position": "PTA",
  "value": 80000000,
  "club": "Newcastle",
  "nationality": "Inglaterra",
  "traits": "Prolific Winger",
  "league": "Premier League"
 },
 {
  "name": "Micky van de Ven",
  "position": "ZAG",
  "value": 55000000,
  "club": "Tottenham",
  "nationality": "Holanda",
  "traits": "Build Up",
  "league": "Premier League"
 },
 {
  "name": "Morgan Gibbs-White",
  "position": "MAT",
  "value": 55000000,
  "club": "Nottingham Forest",
  "nationality": "Inglaterra",
  "traits": "Creative Playmaker",
  "league": "Premier League"
 },
 {
  "name": "Eberechi Eze",
  "position": "MAT",
  "value": 60000000,
  "club": "Arsenal",
  "nationality": "Inglaterra",
  "traits": "Creative Playmaker",
  "league": "Premier League"
 },
 {
  "name": "Morgan Rogers",
  "position": "PTA",
  "value": 70000000,
  "club": "Aston Villa",
  "nationality": "Inglaterra",
  "traits": "Prolific Winger",
  "league": "Premier League"
 },
 {
  "name": "Noni Madueke",
  "position": "PTA",
  "value": 45000000,
  "club": "Arsenal",
  "nationality": "Inglaterra",
  "traits": "Prolific Winger",
  "league": "Premier League"
 },
 {
  "name": "Malo Gusto",
  "position": "LAT",
  "value": 40000000,
  "club": "Chelsea",
  "nationality": "França",
  "traits": "Offensive Full-back",
  "league": "Premier League"
 },
 {
  "name": "Levi Colwill",
  "position": "ZAG",
  "value": 55000000,
  "club": "Chelsea",
  "nationality": "Inglaterra",
  "traits": "Build Up",
  "league": "Premier League"
 },
 {
  "name": "Marc Guéhi",
  "position": "ZAG",
  "value": 45000000,
  "club": "Crystal Palace",
  "nationality": "Inglaterra",
  "traits": "Build Up",
  "league": "Premier League"
 },
 {
  "name": "Piero Hincapié",
  "position": "ZAG",
  "value": 50000000,
  "club": "Arsenal",
  "nationality": "Equador",
  "traits": "Build Up",
  "league": "Premier League"
 },
 {
  "name": "Pedro Neto",
  "position": "PTA",
  "value": 45000000,
  "club": "Chelsea",
  "nationality": "Portugal",
  "traits": "Prolific Winger",
  "league": "Premier League"
 },
 {
  "name": "Christopher Nkunku",
  "position": "CA",
  "value": 35000000,
  "club": "Chelsea",
  "nationality": "França",
  "traits": "Deep-Lying Forward",
  "league": "Premier League"
 },
 {
  "name": "Nicolas Jackson",
  "position": "CA",
  "value": 35000000,
  "club": "Chelsea",
  "nationality": "Senegal",
  "traits": "Goal Poacher",
  "league": "Premier League"
 },
 {
  "name": "Darwin Núñez",
  "position": "CA",
  "value": 45000000,
  "club": "Liverpool",
  "nationality": "Uruguai",
  "traits": "Goal Poacher",
  "league": "Premier League"
 },
 {
  "name": "Ryan Gravenberch",
  "position": "MCT",
  "value": 60000000,
  "club": "Liverpool",
  "nationality": "Holanda",
  "traits": "Box-to-Box",
  "league": "Premier League"
 },
 {
  "name": "Kobbie Mainoo",
  "position": "MCT",
  "value": 45000000,
  "club": "Manchester United",
  "nationality": "Inglaterra",
  "traits": "Box-to-Box",
  "league": "Premier League"
 },
 {
  "name": "Lamine Yamal",
  "position": "PTA",
  "value": 200000000,
  "club": "Barcelona",
  "nationality": "Espanha",
  "traits": "Prolific Winger",
  "league": "La Liga"
 },
 {
  "name": "Pedri",
  "position": "MCT",
  "value": 120000000,
  "club": "Barcelona",
  "nationality": "Espanha",
  "traits": "Creative Playmaker",
  "league": "La Liga"
 },
 {
  "name": "Raphinha",
  "position": "PTA",
  "value": 90000000,
  "club": "Barcelona",
  "nationality": "Brasil",
  "traits": "Prolific Winger",
  "league": "La Liga"
 },
 {
  "name": "Pau Cubarsí",
  "position": "ZAG",
  "value": 80000000,
  "club": "Barcelona",
  "nationality": "Espanha",
  "traits": "Build Up",
  "league": "La Liga"
 },
 {
  "name": "Ronald Araújo",
  "position": "ZAG",
  "value": 50000000,
  "club": "Barcelona",
  "nationality": "Uruguai",
  "traits": "Build Up",
  "league": "La Liga"
 },
 {
  "name": "Dani Olmo",
  "position": "MAT",
  "value": 50000000,
  "club": "Barcelona",
  "nationality": "Espanha",
  "traits": "Creative Playmaker",
  "league": "La Liga"
 },
 {
  "name": "Nico Williams",
  "position": "PTA",
  "value": 70000000,
  "club": "Athletic Club",
  "nationality": "Espanha",
  "traits": "Prolific Winger",
  "league": "La Liga"
 },
 {
  "name": "Antoine Griezmann",
  "position": "CA",
  "value": 20000000,
  "club": "Atlético de Madrid",
  "nationality": "França",
  "traits": "Deep-Lying Forward",
  "league": "La Liga"
 },
 {
  "name": "Álex Baena",
  "position": "MAT",
  "value": 40000000,
  "club": "Atlético de Madrid",
  "nationality": "Espanha",
  "traits": "Creative Playmaker",
  "league": "La Liga"
 },
 {
  "name": "Ferran Torres",
  "position": "PTA",
  "value": 30000000,
  "club": "Barcelona",
  "nationality": "Espanha",
  "traits": "Prolific Winger",
  "league": "La Liga"
 },
 {
  "name": "Alberto Moleiro",
  "position": "PTA",
  "value": 50000000,
  "club": "Villarreal",
  "nationality": "Espanha",
  "traits": "Creative Playmaker",
  "league": "La Liga"
 },
 {
  "name": "Sergio Arribas",
  "position": "MAT",
  "value": 20000000,
  "club": "Almería",
  "nationality": "Espanha",
  "traits": "Creative Playmaker",
  "league": "La Liga"
 },
 {
  "name": "Mikel Merino",
  "position": "MCT",
  "value": 25000000,
  "club": "Real Sociedad",
  "nationality": "Espanha",
  "traits": "Orchestrator",
  "league": "La Liga"
 },
 {
  "name": "Martín Zubimendi",
  "position": "VOL",
  "value": 55000000,
  "club": "Arsenal",
  "nationality": "Espanha",
  "traits": "Orchestrator",
  "league": "La Liga"
 },
 {
  "name": "Brahim Díaz",
  "position": "MAT",
  "value": 35000000,
  "club": "Real Madrid",
  "nationality": "Marrocos",
  "traits": "Creative Playmaker",
  "league": "La Liga"
 },
 {
  "name": "Fran García",
  "position": "LAT",
  "value": 18000000,
  "club": "Real Madrid",
  "nationality": "Espanha",
  "traits": "Offensive Full-back",
  "league": "La Liga"
 },
 {
  "name": "Lucas Vázquez",
  "position": "LAT",
  "value": 4000000,
  "club": "Real Madrid",
  "nationality": "Espanha",
  "traits": "Offensive Full-back",
  "league": "La Liga"
 },
 {
  "name": "Alejandro Balde",
  "position": "LAT",
  "value": 35000000,
  "club": "Barcelona",
  "nationality": "Espanha",
  "traits": "Offensive Full-back",
  "league": "La Liga"
 },
 {
  "name": "Takefusa Kubo",
  "position": "PTA",
  "value": 50000000,
  "club": "Real Sociedad",
  "nationality": "Japão",
  "traits": "Creative Playmaker",
  "league": "La Liga"
 },
 {
  "name": "Yeremy Pino",
  "position": "PTA",
  "value": 35000000,
  "club": "Villarreal",
  "nationality": "Espanha",
  "traits": "Prolific Winger",
  "league": "La Liga"
 },
 {
  "name": "Michael Olise",
  "position": "PTA",
  "value": 100000000,
  "club": "Bayern",
  "nationality": "França",
  "traits": "Creative Playmaker",
  "league": "Bundesliga"
 },
 {
  "name": "Jamal Musiala",
  "position": "MAT",
  "value": 130000000,
  "club": "Bayern",
  "nationality": "Alemanha",
  "traits": "Creative Playmaker",
  "league": "Bundesliga"
 },
 {
  "name": "Florian Wirtz",
  "position": "MAT",
  "value": 130000000,
  "club": "Liverpool",
  "nationality": "Alemanha",
  "traits": "Creative Playmaker",
  "league": "Bundesliga"
 },
 {
  "name": "Joshua Kimmich",
  "position": "MCT",
  "value": 40000000,
  "club": "Bayern",
  "nationality": "Alemanha",
  "traits": "Orchestrator",
  "league": "Bundesliga"
 },
 {
  "name": "Xavi Simons",
  "position": "MAT",
  "value": 80000000,
  "club": "RB Leipzig",
  "nationality": "Holanda",
  "traits": "Creative Playmaker",
  "league": "Bundesliga"
 },
 {
  "name": "Benjamin Šeško",
  "position": "CA",
  "value": 70000000,
  "club": "Manchester United",
  "nationality": "Eslovênia",
  "traits": "Goal Poacher",
  "league": "Bundesliga"
 },
 {
  "name": "Nico Schlotterbeck",
  "position": "ZAG",
  "value": 45000000,
  "club": "Dortmund",
  "nationality": "Alemanha",
  "traits": "Build Up",
  "league": "Bundesliga"
 },
 {
  "name": "Karim Adeyemi",
  "position": "PTA",
  "value": 35000000,
  "club": "Dortmund",
  "nationality": "Alemanha",
  "traits": "Prolific Winger",
  "league": "Bundesliga"
 },
 {
  "name": "Serhou Guirassy",
  "position": "CA",
  "value": 45000000,
  "club": "Dortmund",
  "nationality": "Guiné",
  "traits": "Goal Poacher",
  "league": "Bundesliga"
 },
 {
  "name": "Jonathan Burkardt",
  "position": "CA",
  "value": 35000000,
  "club": "Eintracht Frankfurt",
  "nationality": "Alemanha",
  "traits": "Goal Poacher",
  "league": "Bundesliga"
 },
 {
  "name": "Lautaro Martínez",
  "position": "CA",
  "value": 95000000,
  "club": "Inter",
  "nationality": "Argentina",
  "traits": "Goal Poacher",
  "league": "Serie A"
 },
 {
  "name": "Kenan Yıldız",
  "position": "PTA",
  "value": 80000000,
  "club": "Juventus",
  "nationality": "Turquia",
  "traits": "Creative Playmaker",
  "league": "Serie A"
 },
 {
  "name": "Nicolò Barella",
  "position": "MCT",
  "value": 70000000,
  "club": "Inter",
  "nationality": "Itália",
  "traits": "Box-to-Box",
  "league": "Serie A"
 },
 {
  "name": "Alessandro Bastoni",
  "position": "ZAG",
  "value": 70000000,
  "club": "Inter",
  "nationality": "Itália",
  "traits": "Build Up",
  "league": "Serie A"
 },
 {
  "name": "Rafael Leão",
  "position": "PTA",
  "value": 75000000,
  "club": "Milan",
  "nationality": "Portugal",
  "traits": "Prolific Winger",
  "league": "Serie A"
 },
 {
  "name": "Khvicha Kvaratskhelia",
  "position": "PTA",
  "value": 90000000,
  "club": "Napoli",
  "nationality": "Geórgia",
  "traits": "Prolific Winger",
  "league": "Serie A"
 },
 {
  "name": "Marcus Thuram",
  "position": "CA",
  "value": 75000000,
  "club": "Inter",
  "nationality": "França",
  "traits": "Goal Poacher",
  "league": "Serie A"
 },
 {
  "name": "Teun Koopmeiners",
  "position": "MCT",
  "value": 40000000,
  "club": "Juventus",
  "nationality": "Holanda",
  "traits": "Orchestrator",
  "league": "Serie A"
 },
 {
  "name": "Denzel Dumfries",
  "position": "LAT",
  "value": 30000000,
  "club": "Inter",
  "nationality": "Holanda",
  "traits": "Offensive Full-back",
  "league": "Serie A"
 },
 {
  "name": "Federico Dimarco",
  "position": "LAT",
  "value": 50000000,
  "club": "Inter",
  "nationality": "Itália",
  "traits": "Offensive Full-back",
  "league": "Serie A"
 },
 {
  "name": "Ousmane Dembélé",
  "position": "PTA",
  "value": 90000000,
  "club": "PSG",
  "nationality": "França",
  "traits": "Prolific Winger",
  "league": "Ligue 1"
 },
 {
  "name": "Désiré Doué",
  "position": "PTA",
  "value": 90000000,
  "club": "PSG",
  "nationality": "França",
  "traits": "Creative Playmaker",
  "league": "Ligue 1"
 },
 {
  "name": "Bradley Barcola",
  "position": "PTA",
  "value": 70000000,
  "club": "PSG",
  "nationality": "França",
  "traits": "Prolific Winger",
  "league": "Ligue 1"
 },
 {
  "name": "João Neves",
  "position": "MCT",
  "value": 140000000,
  "club": "PSG",
  "nationality": "Portugal",
  "traits": "Box-to-Box",
  "league": "Ligue 1"
 },
 {
  "name": "Warren Zaïre-Emery",
  "position": "MCT",
  "value": 70000000,
  "club": "PSG",
  "nationality": "França",
  "traits": "Box-to-Box",
  "league": "Ligue 1"
 },
 {
  "name": "Achraf Hakimi",
  "position": "LAT",
  "value": 60000000,
  "club": "PSG",
  "nationality": "Marrocos",
  "traits": "Offensive Full-back",
  "league": "Ligue 1"
 },
 {
  "name": "Vitinha",
  "position": "MCT",
  "value": 60000000,
  "club": "PSG",
  "nationality": "Portugal",
  "traits": "Orchestrator",
  "league": "Ligue 1"
 },
 {
  "name": "Rayan Cherki",
  "position": "MAT",
  "value": 45000000,
  "club": "Manchester City",
  "nationality": "França",
  "traits": "Creative Playmaker",
  "league": "Ligue 1"
 },
 {
  "name": "Maghnes Akliouche",
  "position": "MAT",
  "value": 40000000,
  "club": "Monaco",
  "nationality": "França",
  "traits": "Creative Playmaker",
  "league": "Ligue 1"
 },
 {
  "name": "Jonathan David",
  "position": "CA",
  "value": 45000000,
  "club": "Lille",
  "nationality": "Canadá",
  "traits": "Goal Poacher",
  "league": "Ligue 1"
 },
 {
  "name": "Johan Bakayoko",
  "position": "PTA",
  "value": 35000000,
  "club": "PSV",
  "nationality": "Bélgica",
  "traits": "Prolific Winger",
  "league": "Eredivisie"
 },
 {
  "name": "Ismael Saibari",
  "position": "MAT",
  "value": 30000000,
  "club": "PSV",
  "nationality": "Marrocos",
  "traits": "Hole Player",
  "league": "Eredivisie"
 },
 {
  "name": "Malik Tillman",
  "position": "MAT",
  "value": 35000000,
  "club": "PSV",
  "nationality": "EUA",
  "traits": "Creative Playmaker",
  "league": "Eredivisie"
 },
 {
  "name": "Kenneth Taylor",
  "position": "MCT",
  "value": 30000000,
  "club": "Ajax",
  "nationality": "Holanda",
  "traits": "Box-to-Box",
  "league": "Eredivisie"
 },
 {
  "name": "Wout Weghorst",
  "position": "CA",
  "value": 8000000,
  "club": "Ajax",
  "nationality": "Holanda",
  "traits": "Target Man",
  "league": "Eredivisie"
 },
 {
  "name": "Sem Steijn",
  "position": "MAT",
  "value": 30000000,
  "club": "Twente",
  "nationality": "Holanda",
  "traits": "Hole Player",
  "league": "Eredivisie"
 },
 {
  "name": "Ruben van Bommel",
  "position": "PTA",
  "value": 25000000,
  "club": "AZ",
  "nationality": "Holanda",
  "traits": "Prolific Winger",
  "league": "Eredivisie"
 },
 {
  "name": "Brian Brobbey",
  "position": "CA",
  "value": 25000000,
  "club": "Ajax",
  "nationality": "Holanda",
  "traits": "Goal Poacher",
  "league": "Eredivisie"
 },
 {
  "name": "Joey Veerman",
  "position": "MCT",
  "value": 25000000,
  "club": "PSV",
  "nationality": "Holanda",
  "traits": "Orchestrator",
  "league": "Eredivisie"
 },
 {
  "name": "Quinten Timber",
  "position": "MCT",
  "value": 30000000,
  "club": "Feyenoord",
  "nationality": "Holanda",
  "traits": "Box-to-Box",
  "league": "Eredivisie"
 },
 {
  "name": "Victor Froholdt",
  "position": "MCT",
  "value": 50000000,
  "club": "FC Porto",
  "nationality": "Dinamarca",
  "traits": "Orchestrator",
  "league": "Liga Portugal"
 },
 {
  "name": "Morten Hjulmand",
  "position": "VOL",
  "value": 45000000,
  "club": "Sporting",
  "nationality": "Dinamarca",
  "traits": "Anchor Man",
  "league": "Liga Portugal"
 },
 {
  "name": "Geovany Quenda",
  "position": "PTA",
  "value": 40000000,
  "club": "Sporting",
  "nationality": "Portugal",
  "traits": "Prolific Winger",
  "league": "Liga Portugal"
 },
 {
  "name": "Pedro Gonçalves",
  "position": "MAT",
  "value": 30000000,
  "club": "Sporting",
  "nationality": "Portugal",
  "traits": "Creative Playmaker",
  "league": "Liga Portugal"
 },
 {
  "name": "Ousmane Diomande",
  "position": "ZAG",
  "value": 45000000,
  "club": "Sporting",
  "nationality": "Costa do Marfim",
  "traits": "Build Up",
  "league": "Liga Portugal"
 },
 {
  "name": "António Silva",
  "position": "ZAG",
  "value": 40000000,
  "club": "Benfica",
  "nationality": "Portugal",
  "traits": "Build Up",
  "league": "Liga Portugal"
 },
 {
  "name": "Ángel Di María",
  "position": "PTA",
  "value": 3000000,
  "club": "Benfica",
  "nationality": "Argentina",
  "traits": "Creative Playmaker",
  "league": "Liga Portugal"
 },
 {
  "name": "Alan Varela",
  "position": "VOL",
  "value": 30000000,
  "club": "FC Porto",
  "nationality": "Argentina",
  "traits": "Anchor Man",
  "league": "Liga Portugal"
 },
 {
  "name": "Vangelis Pavlidis",
  "position": "CA",
  "value": 25000000,
  "club": "Benfica",
  "nationality": "Grécia",
  "traits": "Goal Poacher",
  "league": "Liga Portugal"
 },
 {
  "name": "Trincão",
  "position": "PTA",
  "value": 25000000,
  "club": "Sporting",
  "nationality": "Portugal",
  "traits": "Prolific Winger",
  "league": "Liga Portugal"
 },
 {
  "name": "Germán Pezzella",
  "position": "ZAG",
  "value": 500000000,
  "club": "River Plate",
  "nationality": "Argentina",
  "traits": "Build Up",
  "league": "Argentina"
 },
 {
  "name": "Franco Mastantuono",
  "position": "MAT",
  "value": 45000000,
  "club": "Real Madrid",
  "nationality": "Argentina",
  "traits": "Creative Playmaker",
  "league": "Argentina"
 },
 {
  "name": "Claudio Echeverri",
  "position": "MAT",
  "value": 25000000,
  "club": "Manchester City",
  "nationality": "Argentina",
  "traits": "Creative Playmaker",
  "league": "Argentina"
 },
 {
  "name": "Marcos Acuña",
  "position": "LAT",
  "value": 2000000,
  "club": "River Plate",
  "nationality": "Argentina",
  "traits": "Offensive Full-back",
  "league": "Argentina"
 },
 {
  "name": "Facundo Colidio",
  "position": "CA",
  "value": 12000000,
  "club": "River Plate",
  "nationality": "Argentina",
  "traits": "Goal Poacher",
  "league": "Argentina"
 },
 {
  "name": "Maximiliano Salas",
  "position": "CA",
  "value": 8000000,
  "club": "River Plate",
  "nationality": "Argentina",
  "traits": "Goal Poacher",
  "league": "Argentina"
 },
 {
  "name": "Kevin Zenón",
  "position": "PTA",
  "value": 15000000,
  "club": "Boca Juniors",
  "nationality": "Argentina",
  "traits": "Prolific Winger",
  "league": "Argentina"
 },
 {
  "name": "Alan Velasco",
  "position": "MAT",
  "value": 8000000,
  "club": "Boca Juniors",
  "nationality": "Argentina",
  "traits": "Creative Playmaker",
  "league": "Argentina"
 },
 {
  "name": "Esequiel Barco",
  "position": "PTA",
  "value": 15000000,
  "club": "River Plate",
  "nationality": "Argentina",
  "traits": "Prolific Winger",
  "league": "Argentina"
 },
 {
  "name": "Leandro Paredes",
  "position": "VOL",
  "value": 5000000,
  "club": "Boca Juniors",
  "nationality": "Argentina",
  "traits": "Orchestrator",
  "league": "Argentina"
 }
];
