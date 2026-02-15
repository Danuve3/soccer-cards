/* ============================================================
   SOCCER CARDS - LA LIGA 2025/26
   Team data and event types
   ============================================================ */

const TEAMS=[
{n:"Real Madrid",c:"RMA",c1:"#FFFFFF",c2:"#D4AF37",co:"Xabi Alonso",l:["Alfredo Di Stefano",97],p:[
["Thibaut Courtois",89],["Andriy Lunin",80],["Dani Carvajal",85],["Eder Militao",86],["Antonio Rudiger",85],["David Alaba",82],["Ferland Mendy",82],["Trent Alexander-Arnold",87],["Dean Huijsen",78],["Raul Asencio",74],["Alvaro Carreras",76],["Fran Garcia",78],["Jude Bellingham",90],["Eduardo Camavinga",85],["Federico Valverde",89],["Aurelien Tchouameni",86],["Arda Guler",81],["Dani Ceballos",79],["Brahim Diaz",80],["Vinicius Junior",93],["Kylian Mbappe",91],["Rodrygo",86],["Franco Mastantuono",76],["Fran Gonzalez",65],["Jesus Fortea",66]
]},
{n:"FC Barcelona",c:"BAR",c1:"#A50044",c2:"#004D98",co:"Hansi Flick",l:["Johan Cruyff",96],p:[
["Wojciech Szczesny",82],["Joan Garcia",76],["Joao Cancelo",84],["Alejandro Balde",81],["Ronald Araujo",86],["Pau Cubarsi",82],["Andreas Christensen",80],["Jules Kounde",86],["Eric Garcia",78],["Gerard Martin",72],["Gavi",84],["Pedri",88],["Fermin Lopez",80],["Marc Casado",80],["Dani Olmo",86],["Frenkie de Jong",84],["Marc Bernal",74],["Ferran Torres",80],["Robert Lewandowski",88],["Lamine Yamal",86],["Raphinha",86],["Marcus Rashford",82],["Roony Bardghji",74],["Toni Fernandez",66],["Diego Kochen",62]
]},
{n:"Atletico de Madrid",c:"ATM",c1:"#CE3524",c2:"#27447E",co:"Diego Simeone",l:["Fernando Torres",91],p:[
["Jan Oblak",89],["Juan Musso",80],["Jose Maria Gimenez",83],["Robin Le Normand",82],["Clement Lenglet",78],["David Hancko",81],["Nahuel Molina",80],["Marc Pubill",75],["Matteo Ruggeri",78],["Koke",82],["Pablo Barrios",80],["Alex Baena",83],["Marcos Llorente",82],["Thiago Almada",79],["Johnny Cardoso",78],["Rodrigo Mendoza",72],["Obed Vargas",70],["Antoine Griezmann",87],["Julian Alvarez",87],["Alexander Sorloth",82],["Giuliano Simeone",76],["Ademola Lookman",84],["Nicolas Gonzalez",80],["Javier Serrano",72],["Ilias Kostis",66]
]},
{n:"Athletic Club",c:"ATH",c1:"#EE2523",c2:"#FFFFFF",co:"Ernesto Valverde",l:["Telmo Zarra",94],p:[
["Unai Simon",84],["Alex Padilla",72],["Dani Vivian",80],["Aitor Paredes",78],["Yeray Alvarez",77],["Aymeric Laporte",83],["Andoni Gorosabel",76],["Yuri Berchiche",76],["Inigo Lekue",74],["Jesus Areso",74],["Mikel Jauregizar",79],["Oihan Sancet",81],["Mikel Vesga",76],["Inigo Ruiz de Galarreta",77],["Unai Gomez",74],["Robert Navarro",73],["Alex Berenguer",79],["Nico Williams",86],["Inaki Williams",81],["Gorka Guruzeta",80],["Adama Boiro",68],["Nico Serrano",72],["Benat Prados",66],["Maroan Sannadi",64],["Mikel Santos",62]
]},
{n:"Real Betis",c:"BET",c1:"#00954C",c2:"#FFFFFF",co:"Manuel Pellegrini",l:["Joaquin Sanchez",88],p:[
["Alvaro Valles",80],["Pau Lopez",78],["Adrian San Miguel",74],["Hector Bellerin",76],["Diego Llorente",79],["Natan",77],["Marc Bartra",78],["Ricardo Rodriguez",76],["Junior Firpo",77],["Valentin Gomez",73],["Pablo Fornals",81],["Giovani Lo Celso",83],["Sofyan Amrabat",80],["Marc Roca",79],["Isco",80],["Sergi Altimira",76],["Alvaro Fidalgo",75],["Rodrigo Riquelme",81],["Antony",79],["Chimy Avila",78],["Abde Ezzalzouli",77],["Cedric Bakambu",76],["Cucho Hernandez",80],["Aitor Ruibal",76],["Nelson Deossa",74]
]},
{n:"Real Sociedad",c:"RSO",c1:"#2155A4",c2:"#FFFFFF",co:"Imanol Alguacil",l:["Xabi Prieto",86],p:[
["Alex Remiro",83],["Unai Marrero",62],["Aritz Elustondo",76],["Igor Zubeldia",78],["Jon Pacheco",72],["Hamari Traore",73],["Aihen Munoz",76],["Alex Sola",74],["Alvaro Odriozola",74],["Martin Zubimendi",86],["Brais Mendez",80],["Luka Sucic",79],["Ander Barrenetxea",78],["Takefusa Kubo",84],["Mikel Oyarzabal",84],["Orri Oskarsson",76],["Sheraldo Becker",74],["Ander Guevara",74],["Benat Turrientes",73],["Jon Ander Olasagasti",70],["Pablo Marin",66],["Sergio Gomez",74],["Nayef Aguerd",77],["Urko Gonzalez de Zarate",60],["Roberto Lopez",63]
]},
{n:"Villarreal CF",c:"VIL",c1:"#FFE114",c2:"#005B2A",co:"Marcelino Garcia Toral",l:["Marcos Senna",88],p:[
["Diego Conde",74],["Luiz Junior",64],["Logan Costa",76],["Eric Bailly",73],["Juan Foyth",80],["Alfonso Pedraza",78],["Sergi Cardona",74],["Kiko Femenia",73],["Jorge Cuenca",74],["Willy Kambwala",68],["Dani Parejo",81],["Santi Comesana",74],["Ramon Terrats",70],["Denis Suarez",73],["Manu Trigueros",72],["Yeremy Pino",80],["Ilias Akhomach",75],["Thierno Barry",74],["Ayoze Perez",79],["Nicolas Pepe",73],["Gerard Moreno",80],["Arnaut Danjuma",76],["Pape Gueye",73],["Manu Morlanes",73],["Jose Luis Morales",71]
]},
{n:"Girona FC",c:"GIR",c1:"#CD2534",c2:"#FFFFFF",co:"Michel Sanchez",l:["Cristhian Stuani",85],p:[
["Paulo Gazzaniga",78],["Juan Carlos Martin",64],["David Lopez",74],["Daley Blind",77],["Arnau Martinez",76],["Miguel Gutierrez",79],["Alejandro Frances",75],["Juanpe",73],["Ladislav Krejci",76],["Donny van de Beek",74],["Ivan Martin",77],["Yangel Herrera",76],["Oriol Romeu",75],["Bryan Gil",75],["Viktor Tsygankov",79],["Abel Ruiz",74],["Bojan Miovski",75],["Yaser Asprilla",76],["Portu",73],["Jhon Solis",68],["Aimar Oroz",72],["Toni Villa",70],["Cristhian Stuani",74],["Gabriel Misehouy",64],["Pau Victor",68]
]},
{n:"Sevilla FC",c:"SEV",c1:"#D4021D",c2:"#FFFFFF",co:"Garcia Pimienta",l:["Antonio Puerta",87],p:[
["Orjan Nyland",76],["Alberto Flores",60],["Loic Bade",79],["Tanguy Nianzou",75],["Marcao",76],["Kike Salas",74],["Adria Pedrosa",75],["Gonzalo Montiel",76],["Jose Angel Carmona",72],["Nemanja Gudelj",74],["Sambi Lokonga",74],["Lucien Agoume",74],["Djibril Sow",75],["Joan Jordan",76],["Suso",76],["Dodi Lukebakio",78],["Chidera Ejuke",73],["Isaac Romero",76],["Kelechi Iheanacho",74],["Juanlu Sanchez",73],["Valentin Barco",68],["Stanis Idumbo",64],["Peque",66],["Saul Niguez",73],["Jesus Joaquin Fernandez",62]
]},
{n:"RC Celta de Vigo",c:"CEL",c1:"#8AC3EE",c2:"#ED1C24",co:"Claudio Giraldez",l:["Aleksandr Mostovoi",89],p:[
["Vicente Guaita",76],["Ivan Villar",65],["Carl Starfelt",76],["Joseph Aidoo",75],["Unai Nunez",76],["Oscar Mingueza",78],["Marcos Alonso",74],["Hugo Alvarez",68],["Carlos Dominguez",72],["Fran Beltran",77],["Damian Rodriguez",68],["Luca de la Torre",72],["Hugo Sotelo",66],["Williot Swedberg",72],["Franco Cervi",76],["Iago Aspas",82],["Borja Iglesias",76],["Anastasios Douvikas",77],["Jonathan Bamba",75],["Alfon Gonzalez",66],["Kevin Vazquez",72],["Pablo Duran",62],["Jailson",72],["Tadeo Allende",70],["Ilaix Moriba",73]
]},
{n:"CA Osasuna",c:"OSA",c1:"#D91A2A",c2:"#00205B",co:"Vicente Moreno",l:["Patxi Punal",85],p:[
["Sergio Herrera",78],["Aitor Fernandez",75],["Juan Cruz",76],["David Garcia",79],["Alejandro Catena",77],["Unai Garcia",74],["Jesus Areso",76],["Enzo Boyomo",72],["Ruben Pena",75],["Lucas Torro",77],["Jon Moncayola",76],["Aimar Oroz",80],["Pablo Ibanez",74],["Ante Budimir",81],["Kike Garcia",76],["Ruben Garcia",75],["Moi Gomez",76],["Abel Bretones",73],["Iker Munoz",68],["Jorge Herrando",72],["Javi Martinez",71],["Kike Barja",72],["Nacho Vidal",73],["Aitor Bunuel",70],["Jon Magunacelaya",68]
]},
{n:"RCD Mallorca",c:"MLL",c1:"#E20613",c2:"#000000",co:"Jagoba Arrasate",l:["Samuel Eto'o",93],p:[
["Predrag Rajkovic",79],["Leo Roman",72],["Antonio Raillo",77],["Martin Valjent",78],["Johan Mojica",77],["Pablo Maffeo",78],["Siebe Van der Heyden",74],["Giovanni Gonzalez",74],["Antonio Sanchez",73],["Omar Mascarell",76],["Manu Morlanes",76],["Samu Costa",77],["Sergi Darder",79],["Dani Rodriguez",76],["Cyle Larin",77],["Vedat Muriqi",80],["Abdon Prats",74],["Jaume Costa",73],["Toni Lato",74],["Dominik Greif",70],["Copete",71],["Samu Lapsraoui",62],["Costi Lago",68],["Angel Rodriguez",72],["Nastasic",71]
]},
{n:"Rayo Vallecano",c:"RAY",c1:"#E53027",c2:"#FFFFFF",co:"Inigo Perez",l:["Wilfred Agbonavbare",85],p:[
["Augusto Batalla",77],["Dani Cardenas",74],["Florian Lejeune",78],["Abdul Mumin",76],["Andrei Ratiu",79],["Alfonso Espino",76],["Ivan Balliu",74],["Raul Guti",73],["Pathe Ciss",76],["Oscar Valentin",77],["Unai Lopez",76],["Isi Palazon",79],["Alvaro Garcia",78],["Jorge de Frutos",78],["Raul de Tomas",79],["Sergio Camello",77],["Randy Nteka",74],["Pedro Diaz",72],["Oscar Trejo",75],["Adrian Embarba",73],["Diego Lopez",70],["Pep Chavarria",71],["James Rodriguez",76],["Roberto Lopez",62],["Salvi Sanchez",71]
]},
{n:"Getafe CF",c:"GET",c1:"#004FA3",c2:"#E2001A",co:"Jose Bordalas",l:["Pedro Leon",84],p:[
["David Soria",79],["Ruben Yanez",72],["Djene Dakonam",78],["Domingos Duarte",76],["Omar Alderete",77],["Juan Iglesias",74],["Diego Rico",75],["Juan Berrocal",72],["Luis Milla",78],["Mauro Arambarri",78],["Nemanja Maksimovic",76],["Yellu Santiago",68],["Carles Alena",76],["Christantus Uche",74],["Carles Perez",76],["Borja Mayoral",78],["Alvaro Rodriguez",74],["Peter Federico",72],["Coba Gomes",70],["Portu",75],["Luis Javier Suarez",74],["Gaston Alvarez",71],["Allan Nyom",73],["Jakub Jankto",73],["Chrisantus Macauley",64]
]},
{n:"Deportivo Alaves",c:"ALA",c1:"#003DA5",c2:"#FFFFFF",co:"Luis Garcia Plaza",l:["Javi Moreno",86],p:[
["Antonio Sivera",77],["Ander Guevara",75],["Abdel Abqar",74],["Moussa Diarra",75],["Nahuel Tenaglia",74],["Ruben Duarte",74],["Adrian Marin",73],["Santiago Mourino",72],["Carlos Vicente",76],["Jon Guridi",75],["Antonio Blanco",76],["Tomas Conechny",74],["Joan Jordan",76],["Carlos Martin",71],["Luis Rioja",76],["Kike Garcia",78],["Stoichkov",73],["Toni Martinez",75],["Jon Aramburu",72],["Ianis Hagi",74],["Abde Rebbach",72],["Alex Balboa",68],["Luka Romero",70],["Abelardo Ribas",62],["Jesus Owono",68]
]},
{n:"RCD Espanyol",c:"ESP",c1:"#007FC8",c2:"#FFFFFF",co:"Manolo Gonzalez",l:["Raul Tamudo",87],p:[
["Joan Garcia",78],["Fernando Calero",75],["Leandro Cabrera",74],["Omar El Hilali",73],["Carlos Romero",72],["Sergi Gomez",74],["Brian Olivan",73],["Alvaro Tejero",71],["Jose Gragera",74],["Edu Exposito",76],["Alex Kral",77],["Pol Lozano",72],["Salvi Sanchez",70],["Javi Puado",79],["Irvin Cardona",76],["Walid Cheddira",75],["Alejo Veliz",73],["Pere Milla",72],["Luca Koleosho",74],["Jofre Carreras",71],["Alvaro Aguado",73],["Ruben Sanchez",68],["Angel Fortuno",62],["Joan Rojas",60],["Aaron Caricol",66]
]},
{n:"Real Valladolid",c:"VLL",c1:"#6B2F7B",c2:"#FFFFFF",co:"Diego Cocca",l:["Eusebio Sacristan",85],p:[
["Karl Hein",74],["Juma Bah",73],["Luis Perez",72],["David Torres",71],["Lucas Rosa",70],["Cenk Ozkacar",72],["Stanislav Kritciuk",68],["Selim Amallah",75],["Kike Perez",76],["Juanmi Latasa",74],["Raul Moro",75],["Ivan Sanchez",73],["Kenedy",74],["Mamadou Sylla",72],["Marcos Andre",74],["Darwin Machis",73],["Amath Ndiaye",73],["Monchu",72],["Victor Meseguer",71],["Anuar Mohamed",70],["Cadu",68],["Cristo Gonzalez",69],["Ekaitz Jimenez",65],["Joaquin Fernandez",71],["Javier Sanchez",72]
]},
{n:"UD Las Palmas",c:"LPA",c1:"#FFE400",c2:"#0054A6",co:"Diego Martinez",l:["Juan Carlos Valeron",90],p:[
["Jasper Cillessen",78],["Dinko Horkas",72],["Alex Suarez",73],["Scott McKenna",74],["Mika Marmol",76],["Alex Munoz",74],["Viti Rozada",71],["Marvin Park",70],["Daley Sinkgraven",73],["Javi Munoz",76],["Kirian Rodriguez",78],["Alberto Moleiro",80],["Sandro Ramirez",75],["Oli McBurnie",74],["Marc Cardona",72],["Fabio Silva",74],["Jaime Mata",73],["Enzo Loiodice",72],["Jose Campana",77],["Adnan Januzaj",73],["Benito Ramirez",64],["Dario Essugo",71],["Ivan Gil",67],["Oscar Clemente",66],["Manu Fuster",70]
]},
{n:"CD Leganes",c:"LEG",c1:"#1E3A6D",c2:"#FFFFFF",co:"Borja Jimenez",l:["Ruben Perez",82],p:[
["Marko Dmitrovic",76],["Juan Soriano",70],["Jorge Saenz",73],["Enric Franquesa",74],["Sergio Gonzalez",72],["Jorge Cuenca",73],["Matija Nastasic",74],["Oscar Rodriguez",76],["Dani Raba",73],["Seydouba Cisse",72],["Yvan Neyou",73],["Miguel de la Fuente",74],["Juan Cruz",75],["Munir El Haddadi",76],["Sebastien Haller",78],["Renato Tapia",74],["Dani Ojeda",72],["Valentin Rosier",73],["Chicco Lamba",65],["Diego Garcia",70],["Roberto Lopez",71],["Darko Brasanac",73],["Naim Garcia",62],["Gaku Shibasaki",72],["Txomin Banales",60]
]},
{n:"Valencia CF",c:"VAL",c1:"#FFFFFF",c2:"#FF6E00",co:"Carlos Corberan",l:["David Villa",94],p:[
["Giorgi Mamardashvili",84],["Stole Dimitrievski",75],["Cristhian Mosquera",76],["Jose Luis Gaya",81],["Dimitri Foulquier",74],["Cesar Tarrega",73],["Mouctar Diakhaby",74],["Thierry Correia",73],["Yarek Gasiorowski",72],["Hugo Guillamon",78],["Pepelu",78],["Javi Guerra",77],["Andre Almeida",75],["Diego Lopez",76],["Hugo Duro",77],["Rafa Mir",75],["Dani Gomez",73],["Fran Perez",71],["Sergi Canos",73],["Luis Rioja",74],["Samu Castillejo",72],["Joni Montiel",65],["Martin Tejon",60],["Peter Federico",68],["Jesus Vazquez",67]
]}
];

const EVENT_TYPES=[
{t:"swap",n:"Cambio de campo",d:"Intercambia manos con el rival",i:"\u{1F504}"},
{t:"steal",n:"Robo de balon",d:"Roba 1 carta aleatoria del rival",i:"\u{1F590}"},
{t:"yellow",n:"Tarjeta amarilla",d:"-5 puntos al rival en esta baza",i:"\u{1F7E8}"},
{t:"red",n:"Tarjeta roja",d:"Puntuacion rival dividida entre 2",i:"\u{1F7E5}"},
{t:"talk",n:"Charla del descanso",d:"+1 por cada jugador que juegues",i:"\u{1F4AC}"}
];
