// Static library passages with hand-authored questions. Extracted from
// student-reading-quest.jsx so Vite can ship it as its own chunk that's
// downloaded in parallel with the main app code (and cached separately).
// startStoryFromLibrary upgrades these short quizzes to level-appropriate
// AI-generated ones at play time — see getLibraryQuiz().

export const STORY_LIBRARY = [
  {
    id: "a1_1",
    level: "A1",
    title: "My Family",
    topic: "Family",
    passage: "My name is Tom. I am eight years old. I have a mother, a father, and one sister. My sister is five years old. Her name is Lucy. We live in a small house. Our house has three rooms. We have a dog. The dog's name is Max. Max is big and brown. I love my family very much.",
    questions: [
      {
        type: "mcq",
        q: "How old is Tom?",
        options: [
          "Five years old",
          "Six years old",
          "Eight years old",
          "Ten years old"
        ],
        answer: 2,
        explanation: "The passage says 'I am eight years old.'"
      },
      {
        type: "gap_word",
        sentence: "The dog's name is ___.",
        options: [
          "Lucy",
          "Tom",
          "Max",
          "Buddy"
        ],
        answer: 2,
        explanation: "The passage says 'The dog's name is Max.'"
      },
      {
        type: "qa",
        q: "How many rooms does the house have?",
        keywords: [
          "three",
          "rooms",
          "house"
        ],
        explanation: "The house has three rooms. The passage says 'Our house has three rooms.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Max is small and black.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says 'Max is big and brown,' not small and black."
      },
      {
        type: "mcq",
        q: "How old is Lucy?",
        options: [
          "Three years old",
          "Four years old",
          "Five years old",
          "Eight years old"
        ],
        answer: 2,
        explanation: "The passage says 'My sister is five years old.'"
      }
    ]
  },
  {
    id: "a1_2",
    level: "A1",
    title: "At the Market",
    topic: "Shopping",
    passage: "Every Saturday, my mother goes to the market. She buys fruit and vegetables. She buys apples, bananas, and oranges. She also buys carrots and tomatoes. The market is near our house. It is a ten-minute walk. The fruit is fresh and cheap. My mother loves the market.",
    questions: [
      {
        type: "mcq",
        q: "When does the mother go to the market?",
        options: [
          "Every Sunday",
          "Every Saturday",
          "Every Friday",
          "Every Monday"
        ],
        answer: 1,
        explanation: "The passage says 'Every Saturday, my mother goes to the market.'"
      },
      {
        type: "gap_word",
        sentence: "The market is a ten-minute ___ from the house.",
        options: [
          "drive",
          "bus",
          "walk",
          "swim"
        ],
        answer: 2,
        explanation: "The passage says 'It is a ten-minute walk.'"
      },
      {
        type: "qa",
        q: "What fruit does the mother buy at the market?",
        keywords: [
          "apples",
          "bananas",
          "oranges"
        ],
        explanation: "The passage says she buys apples, bananas, and oranges."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The fruit at the market is fresh and cheap.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'The fruit is fresh and cheap.'"
      },
      {
        type: "mcq",
        q: "Which vegetable does the mother buy?",
        options: [
          "Potatoes",
          "Carrots",
          "Onions",
          "Peas"
        ],
        answer: 1,
        explanation: "The passage says 'She also buys carrots and tomatoes.' Carrots is the vegetable listed in the options."
      }
    ]
  },
  {
    id: "a1_3",
    level: "A1",
    title: "My School",
    topic: "School",
    passage: "I go to school every day from Monday to Friday. My school is small. There are twenty students in my class. My teacher's name is Mrs. Green. She is very kind. We study reading, writing, and maths. My favourite subject is maths. School starts at eight o'clock and ends at three o'clock.",
    questions: [
      {
        type: "mcq",
        q: "How many students are in the class?",
        options: [
          "Ten",
          "Twenty",
          "Thirty",
          "Fifteen"
        ],
        answer: 1,
        explanation: "The passage says 'There are twenty students in my class.'"
      },
      {
        type: "gap_word",
        sentence: "The teacher's name is Mrs. ___.",
        options: [
          "Brown",
          "Blue",
          "Green",
          "Grey"
        ],
        answer: 2,
        explanation: "The passage says 'My teacher's name is Mrs. Green.'"
      },
      {
        type: "qa",
        q: "What is the student's favourite subject?",
        keywords: [
          "maths",
          "favourite",
          "subject"
        ],
        explanation: "The student's favourite subject is maths. The passage says 'My favourite subject is maths.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "School starts at nine o'clock.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says 'School starts at eight o'clock', not nine o'clock."
      },
      {
        type: "mcq",
        q: "What subjects do the students study?",
        options: [
          "Art, music, and maths",
          "Reading, writing, and maths",
          "Science, reading, and art",
          "Writing, music, and science"
        ],
        answer: 1,
        explanation: "The passage says 'We study reading, writing, and maths.'"
      }
    ]
  },
  {
    id: "a2_1",
    level: "A2",
    title: "The Lost Key",
    topic: "Daily Life",
    passage: "Yesterday morning, Sarah could not find her house key. She looked everywhere. She checked her bag, her coat pockets, and the kitchen table. Then she remembered — she left it at her friend Anna's house the day before. Sarah called Anna. Anna found the key under the sofa. Sarah was very relieved.",
    questions: [
      {
        type: "mcq",
        q: "Where did Sarah look for her key first?",
        options: [
          "Under the sofa",
          "In her bag",
          "At Anna's house",
          "On the kitchen table"
        ],
        answer: 1,
        explanation: "The passage says Sarah checked her bag first, then her coat pockets and the kitchen table."
      },
      {
        type: "gap_word",
        sentence: "Sarah left her key at her friend ___ house.",
        options: [
          "Mary's",
          "Anna's",
          "Lucy's",
          "Emma's"
        ],
        answer: 1,
        explanation: "The passage says she left it at her friend Anna's house."
      },
      {
        type: "qa",
        q: "Where did Anna find the key?",
        keywords: [
          "under",
          "sofa",
          "found"
        ],
        explanation: "Anna found the key under the sofa, as stated in the passage."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Sarah lost her key in the evening.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says it was yesterday morning, not the evening."
      },
      {
        type: "mcq",
        q: "How did Sarah contact Anna?",
        options: [
          "She sent a message",
          "She visited Anna's house",
          "She called Anna",
          "She emailed Anna"
        ],
        answer: 2,
        explanation: "The passage says 'Sarah called Anna.'"
      },
      {
        type: "gap_word",
        sentence: "After Anna found the key, Sarah felt very ___.",
        options: [
          "angry",
          "sad",
          "tired",
          "relieved"
        ],
        answer: 3,
        explanation: "The passage says 'Sarah was very relieved' at the end of the story."
      }
    ]
  },
  {
    id: "a2_2",
    level: "A2",
    title: "Learning to Cook",
    topic: "Food",
    passage: "Last summer, Pedro decided to learn how to cook. He watched videos online and bought a simple cookbook. First, he learned to make pasta. It was difficult at first, but he practised every day. After two weeks, his pasta was delicious. His family were very proud of him. Now Pedro cooks dinner every Friday.",
    questions: [
      {
        type: "mcq",
        q: "How did Pedro first learn to cook?",
        options: [
          "He took a cooking class.",
          "He watched videos online.",
          "He asked his family.",
          "He read a newspaper."
        ],
        answer: 1,
        explanation: "The passage says 'He watched videos online and bought a simple cookbook.'"
      },
      {
        type: "gap_word",
        sentence: "Pedro learned to make ___ first.",
        options: [
          "rice",
          "soup",
          "pasta",
          "bread"
        ],
        answer: 2,
        explanation: "The passage says 'First, he learned to make pasta.'"
      },
      {
        type: "qa",
        q: "How did Pedro's family feel about his cooking?",
        keywords: [
          "proud",
          "family",
          "happy"
        ],
        explanation: "The passage says 'His family were very proud of him,' so the answer is that his family felt very proud."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Pedro practised cooking every day for two weeks.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'he practised every day' and 'After two weeks, his pasta was delicious.'"
      },
      {
        type: "mcq",
        q: "When does Pedro cook dinner now?",
        options: [
          "Every Monday.",
          "Every Saturday.",
          "Every Sunday.",
          "Every Friday."
        ],
        answer: 3,
        explanation: "The passage says 'Now Pedro cooks dinner every Friday.'"
      },
      {
        type: "gap_word",
        sentence: "Pedro bought a simple ___ to help him learn to cook.",
        options: [
          "cookbook",
          "magazine",
          "newspaper",
          "notebook"
        ],
        answer: 0,
        explanation: "The passage says 'he watched videos online and bought a simple cookbook.'"
      }
    ]
  },
  {
    id: "a2_3",
    level: "A2",
    title: "The New Neighbour",
    topic: "Community",
    passage: "A new family moved into the house next door last month. They have two children — a boy called Marco and a girl called Lily. Marco is the same age as me, so we go to the same school. Lily is younger; she goes to primary school. Their parents are both doctors. The whole family is very friendly. We often invite them for dinner.",
    questions: [
      {
        type: "mcq",
        q: "What is the job of the new family's parents?",
        options: [
          "Teachers",
          "Doctors",
          "Engineers",
          "Nurses"
        ],
        answer: 1,
        explanation: "The passage says 'Their parents are both doctors.'"
      },
      {
        type: "gap_word",
        sentence: "Marco is the same ___ as the narrator, so they go to the same school.",
        options: [
          "school",
          "house",
          "age",
          "street"
        ],
        answer: 2,
        explanation: "The passage says 'Marco is the same age as me, so we go to the same school.'"
      },
      {
        type: "qa",
        q: "Where does Lily go to school?",
        keywords: [
          "primary",
          "school",
          "younger"
        ],
        explanation: "Lily goes to primary school. The passage says 'Lily is younger; she goes to primary school.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The new family moved in last month.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'A new family moved into the house next door last month.'"
      },
      {
        type: "mcq",
        q: "How many children does the new family have?",
        options: [
          "One",
          "Three",
          "Four",
          "Two"
        ],
        answer: 3,
        explanation: "The passage says 'They have two children — a boy called Marco and a girl called Lily.'"
      },
      {
        type: "gap_word",
        sentence: "The narrator's family often ___ the new neighbours for dinner.",
        options: [
          "visits",
          "invites",
          "calls",
          "meets"
        ],
        answer: 1,
        explanation: "The passage says 'We often invite them for dinner.'"
      }
    ]
  },
  {
    id: "b1_1",
    level: "B1",
    title: "The Power of Habit",
    topic: "Psychology",
    passage: "Scientists say that about 40% of our daily actions are habits, not decisions. A habit is formed when a behaviour is repeated so often that it becomes automatic. The brain creates a loop: a cue triggers the habit, the routine follows, and then there is a reward. Breaking a bad habit is hard because the brain loop remains even when the behaviour stops. The most effective strategy is not to try to stop the habit but to replace it with a different routine triggered by the same cue.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what percentage of our daily actions are habits?",
        options: [
          "20%",
          "30%",
          "40%",
          "50%"
        ],
        answer: 2,
        explanation: "The passage states that 'about 40% of our daily actions are habits, not decisions.'"
      },
      {
        type: "gap_word",
        sentence: "A habit is formed when a behaviour is repeated so often that it becomes ___.",
        options: [
          "difficult",
          "automatic",
          "boring",
          "useful"
        ],
        answer: 1,
        explanation: "The passage says 'a behaviour is repeated so often that it becomes automatic.'"
      },
      {
        type: "qa",
        q: "What are the three parts of the brain loop described in the passage?",
        keywords: [
          "cue",
          "routine",
          "reward"
        ],
        explanation: "According to the passage, the brain loop consists of a cue that triggers the habit, the routine that follows, and then a reward."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The brain loop disappears completely when a person stops a bad habit.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says 'the brain loop remains even when the behaviour stops,' meaning it does not disappear."
      },
      {
        type: "mcq",
        q: "What does the passage say is the most effective way to break a bad habit?",
        options: [
          "Stop the habit immediately",
          "Find a doctor to help you",
          "Replace it with a different routine",
          "Remove all cues from your life"
        ],
        answer: 2,
        explanation: "The passage states 'the most effective strategy is not to try to stop the habit but to replace it with a different routine.'"
      },
      {
        type: "gap_word",
        sentence: "The new routine should be triggered by the ___ cue as the old habit.",
        options: [
          "different",
          "stronger",
          "same",
          "new"
        ],
        answer: 2,
        explanation: "The passage says the different routine should be 'triggered by the same cue.'"
      },
      {
        type: "qa",
        q: "Why is it difficult to break a bad habit, according to the passage?",
        keywords: [
          "brain",
          "loop",
          "remains"
        ],
        explanation: "It is difficult because the brain loop remains even after the behaviour stops, so the habit pattern stays in the brain."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Scientists have studied habits in children more than in adults.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage does not mention children or any specific group of people studied by scientists."
      }
    ]
  },
  {
    id: "b1_2",
    level: "B1",
    title: "Urban Farming",
    topic: "Environment",
    passage: "As cities grow larger, some people are finding creative ways to grow food in urban areas. Rooftop gardens, vertical farms, and community allotments are becoming more common. Urban farming offers several benefits: it reduces the distance food travels, provides fresh produce to local communities, and helps people reconnect with nature. However, it also faces challenges such as limited space, high costs, and lack of sunlight in dense cities.",
    questions: [
      {
        type: "mcq",
        q: "Which of the following is mentioned as an example of urban farming?",
        options: [
          "Underground tunnels",
          "Rooftop gardens",
          "Floating farms",
          "Desert greenhouses"
        ],
        answer: 1,
        explanation: "The passage states that 'rooftop gardens, vertical farms, and community allotments are becoming more common.'"
      },
      {
        type: "gap_word",
        sentence: "Urban farming helps reduce the ___ that food travels.",
        options: [
          "cost",
          "weight",
          "distance",
          "time"
        ],
        answer: 2,
        explanation: "The passage says urban farming 'reduces the distance food travels.'"
      },
      {
        type: "qa",
        q: "Why might urban farming help people feel better about their lives in cities?",
        keywords: [
          "nature",
          "reconnect",
          "community"
        ],
        explanation: "According to the passage, urban farming 'helps people reconnect with nature,' which can improve wellbeing in city environments."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Urban farming is only popular in small towns.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says urban farming is happening in 'cities' as they 'grow larger,' not in small towns."
      },
      {
        type: "mcq",
        q: "Which of the following is listed as a challenge of urban farming?",
        options: [
          "Too much water",
          "High costs",
          "Too many workers",
          "Lack of seeds"
        ],
        answer: 1,
        explanation: "The passage mentions 'high costs' as one of the challenges facing urban farming."
      },
      {
        type: "gap_word",
        sentence: "Urban farming provides fresh ___ to local communities.",
        options: [
          "medicine",
          "water",
          "produce",
          "energy"
        ],
        answer: 2,
        explanation: "The passage states that urban farming 'provides fresh produce to local communities.'"
      },
      {
        type: "qa",
        q: "What problem does a lack of sunlight cause for urban farming?",
        keywords: [
          "challenge",
          "dense",
          "cities"
        ],
        explanation: "The passage lists 'lack of sunlight in dense cities' as one of the challenges urban farming faces, making it harder to grow plants."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Governments are giving money to support urban farming projects.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage does not mention anything about government funding or financial support for urban farming."
      }
    ]
  },
  {
    id: "b1_3",
    level: "B1",
    title: "Sleep and Memory",
    topic: "Science",
    passage: "Most people know that sleep is important for health, but fewer understand exactly why. During sleep, the brain is remarkably active. It processes and organises information gathered during the day, moving short-term memories into long-term storage. Research shows that students who sleep well after studying retain significantly more information than those who stay up late. Even a short nap of 20 minutes can improve focus and recall. Experts recommend 7 to 9 hours of sleep per night for adults.",
    questions: [
      {
        type: "mcq",
        q: "What does the brain do with short-term memories during sleep?",
        options: [
          "It deletes them",
          "It moves them to long-term storage",
          "It creates new memories",
          "It slows them down"
        ],
        answer: 1,
        explanation: "The passage states the brain moves short-term memories into long-term storage during sleep."
      },
      {
        type: "gap_word",
        sentence: "Even a short ___ of 20 minutes can improve focus and recall.",
        options: [
          "break",
          "walk",
          "nap",
          "meal"
        ],
        answer: 2,
        explanation: "The passage says 'a short nap of 20 minutes can improve focus and recall.'"
      },
      {
        type: "qa",
        q: "Why do students who sleep well after studying remember more information?",
        keywords: [
          "brain",
          "processes",
          "memories",
          "long-term"
        ],
        explanation: "Because during sleep the brain processes and organises information, moving short-term memories into long-term storage, which helps students retain more."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Most people fully understand why sleep is important for health.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says 'most people know that sleep is important' but 'fewer understand exactly why,' so this statement is false."
      },
      {
        type: "mcq",
        q: "How many hours of sleep do experts recommend for adults each night?",
        options: [
          "5 to 7 hours",
          "6 to 8 hours",
          "7 to 9 hours",
          "8 to 10 hours"
        ],
        answer: 2,
        explanation: "The passage clearly states 'Experts recommend 7 to 9 hours of sleep per night for adults.'"
      },
      {
        type: "gap_word",
        sentence: "Students who sleep well after studying retain ___ more information than those who stay up late.",
        options: [
          "slightly",
          "significantly",
          "rarely",
          "occasionally"
        ],
        answer: 1,
        explanation: "The passage uses the word 'significantly' to describe how much more information well-rested students retain."
      },
      {
        type: "qa",
        q: "What two things can a 20-minute nap improve, according to the passage?",
        keywords: [
          "focus",
          "recall",
          "nap"
        ],
        explanation: "According to the passage, a short nap of 20 minutes can improve focus and recall."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The brain is not very active while a person is sleeping.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that 'during sleep, the brain is remarkably active,' so this statement is false."
      }
    ]
  },
  {
    id: "b2_1",
    level: "B2",
    title: "The Attention Economy",
    topic: "Technology",
    passage: "Social media platforms are designed to capture and hold your attention for as long as possible. Every notification, like, and scroll is engineered to trigger dopamine release, keeping users engaged. This business model — selling advertisers access to user attention — is called the attention economy. Critics argue that this design creates addictive behaviour patterns and fragments our ability to concentrate. Some researchers link heavy social media use to rising rates of anxiety and depression, particularly among teenagers. However, others maintain that correlation does not imply causation, and that the evidence remains inconclusive.",
    questions: [
      {
        type: "mcq",
        q: "What is the main purpose of social media platform design, according to the passage?",
        options: [
          "To help users share content easily",
          "To capture and hold user attention as long as possible",
          "To provide a space for advertisers to create content",
          "To reduce anxiety among teenagers"
        ],
        answer: 1,
        explanation: "The passage states that 'Social media platforms are designed to capture and hold your attention for as long as possible.'"
      },
      {
        type: "gap_word",
        sentence: "Every notification, like, and scroll is engineered to trigger ___ release, keeping users engaged.",
        options: [
          "adrenaline",
          "serotonin",
          "dopamine",
          "cortisol"
        ],
        answer: 2,
        explanation: "The passage explicitly states that these features are engineered to 'trigger dopamine release.'"
      },
      {
        type: "qa",
        q: "What is the attention economy, as described in the passage?",
        keywords: [
          "advertisers",
          "attention",
          "business model",
          "access"
        ],
        explanation: "The attention economy is the business model of selling advertisers access to user attention, as stated directly in the passage."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "All researchers agree that heavy social media use directly causes anxiety and depression.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says 'others maintain that correlation does not imply causation, and that the evidence remains inconclusive,' showing there is no full agreement."
      },
      {
        type: "mcq",
        q: "According to critics, what is one negative effect of social media's design on users?",
        options: [
          "It increases dopamine production permanently",
          "It makes advertising less effective",
          "It creates addictive behaviour patterns",
          "It encourages users to spend more money"
        ],
        answer: 2,
        explanation: "The passage states that 'Critics argue that this design creates addictive behaviour patterns and fragments our ability to concentrate.'"
      },
      {
        type: "gap_word",
        sentence: "Some researchers link heavy social media use to rising rates of anxiety and depression, particularly among ___.",
        options: [
          "adults",
          "teenagers",
          "advertisers",
          "researchers"
        ],
        answer: 1,
        explanation: "The passage specifically mentions that the link to anxiety and depression is 'particularly among teenagers.'"
      },
      {
        type: "qa",
        q: "How do some researchers respond to claims that social media causes anxiety and depression?",
        keywords: [
          "correlation",
          "causation",
          "inconclusive",
          "evidence"
        ],
        explanation: "Some researchers argue that correlation does not imply causation and that the evidence linking social media to anxiety and depression remains inconclusive."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Social media platforms earn money by charging users a monthly subscription fee.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage describes the business model as 'selling advertisers access to user attention,' not charging users subscription fees."
      },
      {
        type: "mcq",
        q: "What does the passage say about the relationship between social media use and concentration?",
        options: [
          "Heavy use improves users' ability to focus",
          "Critics claim it fragments our ability to concentrate",
          "Researchers have proven it destroys concentration",
          "It has no effect on concentration according to the passage"
        ],
        answer: 1,
        explanation: "The passage states that critics argue social media design 'fragments our ability to concentrate.'"
      },
      {
        type: "gap_word",
        sentence: "The business model of selling advertisers access to user attention is called the ___ economy.",
        options: [
          "digital",
          "market",
          "attention",
          "social"
        ],
        answer: 2,
        explanation: "The passage directly defines this business model as 'the attention economy.'"
      }
    ]
  },
  {
    id: "b2_2",
    level: "B2",
    title: "Rewilding",
    topic: "Environment",
    passage: "Rewilding is a conservation approach that aims to restore ecosystems to their natural state by reintroducing species that have disappeared. Unlike traditional conservation, which focuses on protecting what remains, rewilding seeks to rebuild natural processes. The reintroduction of wolves to Yellowstone National Park in the USA is often cited as a success story. The wolves reduced deer populations, which allowed vegetation to recover, which in turn stabilised riverbanks and changed waterflow. This cascade of effects is known as a 'trophic cascade.' Critics, however, warn that reintroducing predators near human settlements can create conflict.",
    questions: [
      {
        type: "mcq",
        q: "What is the main goal of rewilding according to the passage?",
        options: [
          "To restore ecosystems by reintroducing disappeared species",
          "To protect the species that currently exist in nature",
          "To reduce deer populations in national parks",
          "To prevent predators from entering human settlements"
        ],
        answer: 0,
        explanation: "The passage states that rewilding 'aims to restore ecosystems to their natural state by reintroducing species that have disappeared.'"
      },
      {
        type: "gap_word",
        sentence: "Unlike traditional conservation, rewilding seeks to rebuild natural ___.",
        options: [
          "habitats",
          "species",
          "processes",
          "landscapes"
        ],
        answer: 2,
        explanation: "The passage states that rewilding 'seeks to rebuild natural processes,' distinguishing it from traditional conservation."
      },
      {
        type: "qa",
        q: "How did the reintroduction of wolves to Yellowstone National Park affect the rivers?",
        keywords: [
          "vegetation",
          "riverbanks",
          "stabilised",
          "waterflow"
        ],
        explanation: "The wolves reduced deer populations, which allowed vegetation to recover, which in turn stabilised riverbanks and changed waterflow."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The reintroduction of wolves to Yellowstone National Park is considered a successful example of rewilding.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says the Yellowstone wolf reintroduction 'is often cited as a success story.'"
      },
      {
        type: "mcq",
        q: "What does the term 'trophic cascade' refer to in the passage?",
        options: [
          "The reintroduction of wolves into a national park",
          "The reduction of deer populations by predators",
          "A chain of effects caused by one species influencing others",
          "The process of stabilising riverbanks through vegetation"
        ],
        answer: 2,
        explanation: "The passage describes how wolves affected deer, then vegetation, then riverbanks and waterflow, and calls this whole chain of effects a 'trophic cascade.'"
      },
      {
        type: "gap_word",
        sentence: "The wolves reduced deer populations, which allowed ___ to recover.",
        options: [
          "waterflow",
          "vegetation",
          "riverbanks",
          "predators"
        ],
        answer: 1,
        explanation: "The passage states that reduced deer populations 'allowed vegetation to recover,' which then led to further environmental changes."
      },
      {
        type: "qa",
        q: "How does rewilding differ from traditional conservation?",
        keywords: [
          "traditional",
          "protects",
          "rebuilds",
          "processes"
        ],
        explanation: "Traditional conservation focuses on protecting what already exists, whereas rewilding seeks to rebuild natural processes by reintroducing lost species."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The wolves reintroduced to Yellowstone were brought from Canada.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage does not mention where the wolves came from; it only states they were reintroduced to Yellowstone National Park."
      },
      {
        type: "mcq",
        q: "What concern do critics raise about rewilding?",
        options: [
          "It is too expensive to implement effectively",
          "Reintroducing predators near human settlements can cause conflict",
          "It damages vegetation and destabilises riverbanks",
          "It only works in large national parks like Yellowstone"
        ],
        answer: 1,
        explanation: "The passage states that 'Critics warn that reintroducing predators near human settlements can create conflict.'"
      },
      {
        type: "gap_word",
        sentence: "Critics warn that reintroducing predators near human settlements can create ___.",
        options: [
          "damage",
          "imbalance",
          "conflict",
          "competition"
        ],
        answer: 2,
        explanation: "The passage uses the word 'conflict' to describe the problem critics associate with reintroducing predators near human settlements."
      }
    ]
  },
  {
    id: "b2_3",
    level: "B2",
    title: "The Placebo Effect",
    topic: "Medicine",
    passage: "The placebo effect is one of medicine's most fascinating and least understood phenomena. When patients receive an inert treatment — a sugar pill or saline injection — and believe it to be real medication, many show genuine physiological improvements. Studies have recorded reduced pain, lower blood pressure, and even shrinking tumours in placebo recipients. The mechanism is not fully understood, but researchers believe it involves the release of endorphins and changes in neural activity. Ethical debates surround its use: if placebos work, should doctors prescribe them even if doing so involves deception?",
    questions: [
      {
        type: "mcq",
        q: "What is an example of an inert treatment mentioned in the passage?",
        options: [
          "A vitamin supplement",
          "A sugar pill",
          "A herbal remedy",
          "A pain reliever"
        ],
        answer: 1,
        explanation: "The passage specifically mentions 'a sugar pill or saline injection' as examples of inert treatments."
      },
      {
        type: "gap_word",
        sentence: "Researchers believe the placebo effect involves the release of ___ and changes in neural activity.",
        options: [
          "adrenaline",
          "insulin",
          "endorphins",
          "dopamine"
        ],
        answer: 2,
        explanation: "The passage states the mechanism 'involves the release of endorphins and changes in neural activity.'"
      },
      {
        type: "qa",
        q: "What kinds of physical improvements have been observed in patients who received placebos?",
        keywords: [
          "pain",
          "blood pressure",
          "tumours"
        ],
        explanation: "According to the passage, studies recorded reduced pain, lower blood pressure, and even shrinking tumours in placebo recipients."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The mechanism behind the placebo effect is fully understood by scientists.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage clearly states that 'the mechanism is not fully understood,' contradicting this statement."
      },
      {
        type: "mcq",
        q: "What ethical concern about placebos is raised in the passage?",
        options: [
          "They are too expensive to produce",
          "Prescribing them may involve deception",
          "They are illegal in most countries",
          "They only work on certain age groups"
        ],
        answer: 1,
        explanation: "The passage asks whether doctors should prescribe placebos 'even if doing so involves deception,' highlighting this ethical concern."
      },
      {
        type: "gap_word",
        sentence: "The placebo effect is described as one of medicine's most fascinating and least understood ___.",
        options: [
          "treatments",
          "experiments",
          "phenomena",
          "controversies"
        ],
        answer: 2,
        explanation: "The passage opens by calling the placebo effect 'one of medicine's most fascinating and least understood phenomena.'"
      },
      {
        type: "qa",
        q: "Why do ethical debates surround the use of placebos, according to the passage?",
        keywords: [
          "deception",
          "prescribe",
          "doctors"
        ],
        explanation: "The passage explains that ethical debates exist because prescribing placebos may require doctors to deceive their patients, even though the treatments can be effective."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Patients must be told they are receiving a placebo in order for it to have any effect.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage does not discuss whether informing patients about the placebo affects its outcome; this detail is not mentioned."
      },
      {
        type: "mcq",
        q: "According to the passage, what do patients believe when they experience the placebo effect?",
        options: [
          "That they are part of a research study",
          "That their condition is worsening",
          "That the inert treatment is real medication",
          "That they do not need further treatment"
        ],
        answer: 2,
        explanation: "The passage states patients 'believe it to be real medication,' which triggers the placebo effect."
      },
      {
        type: "gap_word",
        sentence: "Along with reduced pain and lower blood pressure, studies also recorded ___ tumours in placebo recipients.",
        options: [
          "growing",
          "unchanged",
          "shrinking",
          "disappearing"
        ],
        answer: 2,
        explanation: "The passage mentions 'even shrinking tumours in placebo recipients' as one of the recorded physiological improvements."
      }
    ]
  },
  {
    id: "c1_1",
    level: "C1",
    title: "The Language Instinct",
    topic: "Linguistics",
    passage: "The linguist Noam Chomsky proposed that humans are born with an innate capacity for language — a 'language acquisition device' hardwired into the brain. This theory sought to explain why children acquire language so rapidly and uniformly across cultures, despite minimal explicit instruction. Critics, however, point to the statistical learning hypothesis, which suggests that children learn language by detecting patterns in the input they receive. Recent neuroimaging studies have identified dedicated language circuits in the brain, lending partial support to Chomsky's view, though the debate between nativist and empiricist accounts of language acquisition remains unresolved.",
    questions: [
      {
        type: "mcq",
        q: "What did Chomsky's theory primarily aim to explain?",
        options: [
          "Why children acquire language rapidly and uniformly across cultures",
          "Why some children learn language faster than others",
          "How neuroimaging can map language circuits in the brain",
          "Why explicit instruction is necessary for language learning"
        ],
        answer: 0,
        explanation: "The passage states the theory 'sought to explain why children acquire language so rapidly and uniformly across cultures, despite minimal explicit instruction.'"
      },
      {
        type: "gap_word",
        sentence: "Chomsky proposed that humans are born with an innate capacity for language, which he called a 'language acquisition ___'.",
        options: [
          "module",
          "system",
          "device",
          "circuit"
        ],
        answer: 2,
        explanation: "The passage uses the exact phrase 'language acquisition device' to describe Chomsky's proposed innate mechanism."
      },
      {
        type: "qa",
        q: "What is the central claim of the statistical learning hypothesis as described in the passage?",
        keywords: [
          "patterns",
          "input",
          "detect",
          "children"
        ],
        explanation: "According to the passage, the statistical learning hypothesis suggests that children learn language by detecting patterns in the input they receive, rather than relying on any innate language structure."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Neuroimaging studies have fully confirmed Chomsky's nativist theory of language acquisition.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states neuroimaging studies lend only 'partial support' to Chomsky's view, and the debate 'remains unresolved', so full confirmation is false."
      },
      {
        type: "mcq",
        q: "How does the passage characterise the current state of the debate between nativist and empiricist accounts of language acquisition?",
        options: [
          "Largely settled in favour of the nativist position",
          "Ongoing and not yet resolved",
          "Conclusively resolved by neuroimaging evidence",
          "Abandoned by most modern linguists"
        ],
        answer: 1,
        explanation: "The passage explicitly states that 'the debate between nativist and empiricist accounts of language acquisition remains unresolved.'"
      },
      {
        type: "gap_word",
        sentence: "Critics of Chomsky point to the ___ learning hypothesis as an alternative explanation for language acquisition.",
        options: [
          "structural",
          "statistical",
          "sequential",
          "social"
        ],
        answer: 1,
        explanation: "The passage refers specifically to 'the statistical learning hypothesis' as the alternative account raised by critics."
      },
      {
        type: "qa",
        q: "What evidence does the passage cite in partial support of Chomsky's view, and why is this support considered only partial?",
        keywords: [
          "neuroimaging",
          "circuits",
          "unresolved",
          "partial"
        ],
        explanation: "The passage cites recent neuroimaging studies that identified dedicated language circuits in the brain as partial support. It is only partial because the debate between nativist and empiricist accounts remains unresolved."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Children across different cultures tend to acquire language in a broadly uniform manner.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage states that children acquire language 'uniformly across cultures', which directly supports this statement."
      },
      {
        type: "mcq",
        q: "According to the passage, what does the term 'language acquisition device' refer to?",
        options: [
          "A digital tool used to teach children foreign languages",
          "A region of the brain identified through neuroimaging",
          "An innate capacity for language hardwired into the brain",
          "A method of detecting statistical patterns in speech input"
        ],
        answer: 2,
        explanation: "The passage describes the 'language acquisition device' as 'an innate capacity for language — hardwired into the brain', proposed by Chomsky."
      },
      {
        type: "gap_word",
        sentence: "Recent neuroimaging studies have identified dedicated language ___ in the brain.",
        options: [
          "regions",
          "circuits",
          "lobes",
          "pathways"
        ],
        answer: 1,
        explanation: "The passage uses the word 'circuits' in the phrase 'dedicated language circuits in the brain'."
      },
      {
        type: "qa",
        q: "In what way does the passage suggest that children's language learning environment contrasts with what Chomsky's theory might seem to require?",
        keywords: [
          "minimal",
          "explicit",
          "instruction",
          "despite"
        ],
        explanation: "The passage notes that children acquire language rapidly and uniformly 'despite minimal explicit instruction', implying that Chomsky's theory explains how rich language learning occurs even in the absence of extensive formal teaching."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The statistical learning hypothesis was originally proposed by Noam Chomsky.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage attributes the statistical learning hypothesis to critics of Chomsky, not to Chomsky himself, making this statement false."
      }
    ]
  },
  {
    id: "c1_2",
    level: "C1",
    title: "The Anthropocene",
    topic: "Climate",
    passage: "Geologists have proposed naming our current epoch the Anthropocene — the age of human influence — to reflect the unprecedented scale of humanity's impact on the Earth's systems. Evidence for this designation includes the global dispersal of microplastics, radionuclides from nuclear testing, and the homogenisation of species assemblages. The proposal is scientifically contested: some argue the changes are insufficient to define a new epoch, while others suggest the Holocene — the epoch beginning after the last ice age — remains the appropriate designation. The debate underscores a deeper question about whether geological time should accommodate human timescales.",
    questions: [
      {
        type: "mcq",
        q: "What does the proposed term 'Anthropocene' primarily reflect?",
        options: [
          "The unprecedented scale of humanity's impact on Earth's systems",
          "The dispersal of radionuclides from nuclear testing",
          "The beginning of the current geological epoch after the last ice age",
          "The homogenisation of geological strata worldwide"
        ],
        answer: 0,
        explanation: "The passage states the Anthropocene is named to 'reflect the unprecedented scale of humanity's impact on the Earth's systems.'"
      },
      {
        type: "gap_word",
        sentence: "Evidence for the Anthropocene designation includes the global ___ of microplastics.",
        options: [
          "production",
          "dispersal",
          "accumulation",
          "regulation"
        ],
        answer: 1,
        explanation: "The passage uses the word 'dispersal' in 'the global dispersal of microplastics.'"
      },
      {
        type: "qa",
        q: "What are the three pieces of evidence cited in the passage to support the designation of the Anthropocene?",
        keywords: [
          "microplastics",
          "radionuclides",
          "homogenisation"
        ],
        explanation: "The passage cites the global dispersal of microplastics, radionuclides from nuclear testing, and the homogenisation of species assemblages as evidence for the Anthropocene designation."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "All geologists agree that the Anthropocene should be recognised as a new epoch.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states the proposal is 'scientifically contested,' indicating there is no universal agreement among geologists."
      },
      {
        type: "mcq",
        q: "Which argument do those who oppose the Anthropocene designation put forward?",
        options: [
          "Human activity has not been sufficiently documented by scientists",
          "The changes observed are insufficient to define a new epoch",
          "The concept of geological epochs is itself outdated",
          "Nuclear testing has had no measurable impact on geological records"
        ],
        answer: 1,
        explanation: "The passage states that 'some argue the changes are insufficient to define a new epoch.'"
      },
      {
        type: "gap_word",
        sentence: "Some scientists suggest the ___, the epoch beginning after the last ice age, remains the appropriate designation.",
        options: [
          "Pleistocene",
          "Anthropocene",
          "Holocene",
          "Cenozoic"
        ],
        answer: 2,
        explanation: "The passage identifies the 'Holocene' as the epoch beginning after the last ice age and the alternative designation proposed by some scientists."
      },
      {
        type: "qa",
        q: "What deeper question does the debate over the Anthropocene underscore, according to the passage?",
        keywords: [
          "geological time",
          "human timescales",
          "accommodate"
        ],
        explanation: "The passage states the debate underscores 'a deeper question about whether geological time should accommodate human timescales,' questioning whether the framework of geological epochs is suited to incorporating human-driven change."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The Holocene epoch began after the last ice age.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly defines the Holocene as 'the epoch beginning after the last ice age.'"
      },
      {
        type: "mcq",
        q: "What does the term 'homogenisation of species assemblages' refer to in the context of the passage?",
        options: [
          "The extinction of species caused by nuclear testing",
          "A form of evidence used to support the Anthropocene designation",
          "A counterargument against defining a new geological epoch",
          "A natural process associated with the end of the last ice age"
        ],
        answer: 1,
        explanation: "The passage lists 'the homogenisation of species assemblages' among the pieces of evidence supporting the Anthropocene designation."
      },
      {
        type: "gap_word",
        sentence: "Geologists have proposed naming our current epoch the Anthropocene to reflect the ___ scale of humanity's impact.",
        options: [
          "gradual",
          "limited",
          "unprecedented",
          "geological"
        ],
        answer: 2,
        explanation: "The passage uses the word 'unprecedented' to describe the scale of humanity's impact on Earth's systems."
      },
      {
        type: "qa",
        q: "Why is the scientific debate about the Anthropocene described as significant beyond the technical question of epoch classification?",
        keywords: [
          "deeper question",
          "geological time",
          "human timescales"
        ],
        explanation: "The passage frames the debate as significant because it raises a deeper philosophical and scientific question about whether the system of geological time, traditionally operating on vast natural timescales, should be adapted to reflect timescales shaped by human activity."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Radionuclides found in geological records originate exclusively from industrial pollution rather than nuclear testing.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage specifically attributes radionuclides to 'nuclear testing,' not to industrial pollution."
      }
    ]
  },
  {
    id: "c1_3",
    level: "C1",
    title: "Confirmation Bias",
    topic: "Psychology",
    passage: "Confirmation bias is the tendency to search for, interpret, and recall information in a way that confirms one's pre-existing beliefs. It operates unconsciously and affects even highly educated individuals. In political discourse, it reinforces polarisation: people curate information environments that reflect their worldview, making genuine dialogue across ideological lines increasingly difficult. In science, it manifests as selective reporting of results that support a hypothesis while ignoring contradictory evidence — a practice known as p-hacking. Mitigating confirmation bias requires deliberate effort: seeking disconfirming evidence, engaging with opposing viewpoints, and employing structured analytical techniques.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what is confirmation bias?",
        options: [
          "A conscious effort to verify one's existing beliefs through research",
          "The tendency to seek, interpret, and recall information that confirms pre-existing beliefs",
          "A scientific method used to test hypotheses systematically",
          "A political strategy used to reinforce ideological polarisation"
        ],
        answer: 1,
        explanation: "The passage defines confirmation bias as 'the tendency to search for, interpret, and recall information in a way that confirms one's pre-existing beliefs.'"
      },
      {
        type: "gap_word",
        sentence: "Confirmation bias operates ___ and affects even highly educated individuals.",
        options: [
          "deliberately",
          "selectively",
          "unconsciously",
          "occasionally"
        ],
        answer: 2,
        explanation: "The passage states that confirmation bias 'operates unconsciously and affects even highly educated individuals.'"
      },
      {
        type: "qa",
        q: "How does confirmation bias contribute to polarisation in political discourse?",
        keywords: [
          "curate",
          "information environments",
          "worldview",
          "dialogue",
          "ideological"
        ],
        explanation: "The passage states that in political discourse, confirmation bias reinforces polarisation because people curate information environments that reflect their worldview, making genuine dialogue across ideological lines increasingly difficult."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Confirmation bias only affects individuals with limited formal education.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly states that confirmation bias 'affects even highly educated individuals,' contradicting the claim that it is limited to those with less education."
      },
      {
        type: "mcq",
        q: "In the context of science, what does the passage identify as a manifestation of confirmation bias?",
        options: [
          "Engaging with opposing viewpoints before publishing findings",
          "Employing structured analytical techniques to evaluate data",
          "Selectively reporting results that support a hypothesis while ignoring contradictory evidence",
          "Conducting peer reviews of experimental methodologies"
        ],
        answer: 2,
        explanation: "The passage describes confirmation bias in science as 'selective reporting of results that support a hypothesis while ignoring contradictory evidence.'"
      },
      {
        type: "gap_word",
        sentence: "The practice of selectively reporting supporting results while ignoring contradictory evidence in science is known as ___.",
        options: [
          "peer review",
          "hypothesis testing",
          "data mining",
          "p-hacking"
        ],
        answer: 3,
        explanation: "The passage states that this selective reporting practice 'is known as p-hacking.'"
      },
      {
        type: "qa",
        q: "What deliberate strategies does the passage suggest for mitigating confirmation bias?",
        keywords: [
          "disconfirming evidence",
          "opposing viewpoints",
          "structured analytical techniques"
        ],
        explanation: "The passage states that mitigating confirmation bias requires seeking disconfirming evidence, engaging with opposing viewpoints, and employing structured analytical techniques."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "P-hacking is a technique recommended by the passage for reducing confirmation bias in science.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage presents p-hacking as a negative manifestation of confirmation bias, not as a recommended technique for reducing it."
      },
      {
        type: "mcq",
        q: "What does the passage suggest about the effort required to counteract confirmation bias?",
        options: [
          "It can be resolved through natural intellectual development over time",
          "It requires deliberate and conscious effort",
          "It is only achievable by trained scientists and researchers",
          "It is unnecessary for individuals who engage regularly in political discourse"
        ],
        answer: 1,
        explanation: "The passage explicitly states that 'mitigating confirmation bias requires deliberate effort,' implying it is not automatic or passive."
      },
      {
        type: "gap_word",
        sentence: "In political discourse, confirmation bias reinforces ___, making genuine dialogue across ideological lines increasingly difficult.",
        options: [
          "cooperation",
          "polarisation",
          "moderation",
          "consensus"
        ],
        answer: 1,
        explanation: "The passage states that in political discourse, confirmation bias 'reinforces polarisation' and hinders genuine dialogue."
      },
      {
        type: "qa",
        q: "What does the passage mean when it refers to people curating 'information environments that reflect their worldview'?",
        keywords: [
          "curate",
          "worldview",
          "political",
          "polarisation",
          "dialogue"
        ],
        explanation: "The passage suggests that individuals selectively choose and consume information sources that align with their existing political beliefs, reinforcing their worldview and reducing exposure to alternative perspectives, which deepens ideological polarisation."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Structured analytical techniques are mentioned as one way to counteract confirmation bias.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly lists 'employing structured analytical techniques' as one of the deliberate efforts required to mitigate confirmation bias."
      }
    ]
  },
  {
    id: "c2_1",
    level: "C2",
    title: "The Ship of Theseus",
    topic: "Philosophy",
    passage: "The Ship of Theseus is an ancient paradox that probes the nature of identity and persistence through change. If every plank of a ship is gradually replaced, at what point — if any — does it cease to be the same ship? Thomas Hobbes extended the puzzle: if the original planks are collected and reassembled, which vessel is the 'true' Ship of Theseus? Contemporary philosophers have mapped this paradox onto questions of personal identity — whether the self persists through total cellular replacement, amnesia, or radical personality change. Derek Parfit argued that identity is not what matters; psychological continuity and connectedness are what ground our practical concerns about the future.",
    questions: [
      {
        type: "mcq",
        q: "What is the primary philosophical concern that the Ship of Theseus paradox investigates?",
        options: [
          "The ethics of material ownership",
          "The nature of identity and persistence through change",
          "The practical limits of ship construction",
          "The relationship between memory and consciousness"
        ],
        answer: 1,
        explanation: "The passage explicitly states the paradox 'probes the nature of identity and persistence through change.'"
      },
      {
        type: "gap_word",
        sentence: "Thomas Hobbes extended the puzzle by asking which vessel would be the 'true' Ship of Theseus if the original ___ were collected and reassembled.",
        options: [
          "sailors",
          "blueprints",
          "planks",
          "nails"
        ],
        answer: 2,
        explanation: "The passage states: 'if the original planks are collected and reassembled, which vessel is the true Ship of Theseus?'"
      },
      {
        type: "qa",
        q: "In what way did Thomas Hobbes deepen the complexity of the Ship of Theseus paradox beyond its original formulation?",
        keywords: [
          "planks",
          "reassembled",
          "true",
          "vessel"
        ],
        explanation: "Hobbes added a second layer by positing that if the discarded original planks were gathered and rebuilt into a ship, there would then be two competing claimants to the title of the 'true' Ship of Theseus, intensifying the question of identity."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The Ship of Theseus paradox originates from ancient Greek philosophical tradition.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage describes the paradox as 'ancient' but does not specify that it originates from ancient Greek tradition."
      },
      {
        type: "mcq",
        q: "Which of the following scenarios is NOT mentioned in the passage as a contemporary application of the Ship of Theseus paradox to personal identity?",
        options: [
          "Total cellular replacement",
          "Amnesia",
          "Radical personality change",
          "Near-death experience"
        ],
        answer: 3,
        explanation: "The passage lists cellular replacement, amnesia, and radical personality change as applications, but near-death experience is not mentioned."
      },
      {
        type: "gap_word",
        sentence: "Derek Parfit contended that psychological continuity and ___ are what ground our practical concerns about the future.",
        options: [
          "memory",
          "connectedness",
          "rationality",
          "embodiment"
        ],
        answer: 1,
        explanation: "The passage states Parfit argued that 'psychological continuity and connectedness are what ground our practical concerns about the future.'"
      },
      {
        type: "qa",
        q: "What does Derek Parfit claim is the correct basis for our practical concerns about the future self, and how does this challenge conventional notions of identity?",
        keywords: [
          "identity",
          "psychological",
          "continuity",
          "connectedness",
          "matters"
        ],
        explanation: "Parfit argues that identity itself is not what matters; rather, psychological continuity and connectedness are the true grounds of our future-oriented concerns, thereby displacing the concept of fixed personal identity from its central role."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Derek Parfit believed that personal identity is the most important factor in grounding our concerns about the future.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly states Parfit 'argued that identity is not what matters,' directly contradicting this statement."
      },
      {
        type: "mcq",
        q: "What triggers the central question of the Ship of Theseus paradox in its original formulation?",
        options: [
          "The sudden destruction of the ship in a storm",
          "The gradual replacement of every plank of the ship",
          "The construction of an identical replica ship",
          "The loss of the ship's historical records"
        ],
        answer: 1,
        explanation: "The passage describes the paradox as arising when 'every plank of a ship is gradually replaced,' prompting the question of whether it remains the same ship."
      },
      {
        type: "gap_word",
        sentence: "Contemporary philosophers have mapped the Ship of Theseus paradox onto questions of ___ identity.",
        options: [
          "national",
          "cultural",
          "personal",
          "legal"
        ],
        answer: 2,
        explanation: "The passage states: 'Contemporary philosophers have mapped this paradox onto questions of personal identity.'"
      },
      {
        type: "qa",
        q: "How does the gradual nature of the replacement in the Ship of Theseus thought experiment contribute to the difficulty of pinpointing when, if ever, the ship loses its original identity?",
        keywords: [
          "gradual",
          "point",
          "cease",
          "same"
        ],
        explanation: "Because the replacement is gradual rather than instantaneous, there is no clear threshold at which one can definitively say the ship has become a different vessel; the passage frames this with 'at what point — if any — does it cease to be the same ship,' highlighting the indeterminacy."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The paradox of the Ship of Theseus has been applied to debates about whether selfhood survives amnesia.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly lists amnesia as one of the scenarios onto which contemporary philosophers have mapped the paradox."
      },
      {
        type: "mcq",
        q: "According to the passage, what is the correct characterisation of the Ship of Theseus as a philosophical problem?",
        options: [
          "A modern thought experiment with no historical precedent",
          "An ancient paradox concerning identity and change",
          "A legal dispute about property rights over vessels",
          "A scientific hypothesis about material composition"
        ],
        answer: 1,
        explanation: "The passage opens by describing it as 'an ancient paradox that probes the nature of identity and persistence through change.'"
      },
      {
        type: "gap_word",
        sentence: "Parfit argued that identity is not what ___; psychological continuity and connectedness are what ground our practical concerns.",
        options: [
          "changes",
          "persists",
          "matters",
          "defines"
        ],
        answer: 2,
        explanation: "The passage uses the exact phrasing: 'Parfit argued that identity is not what matters.'"
      },
      {
        type: "qa",
        q: "In what ways does the passage suggest that radical personality change poses a challenge to conventional theories of personal identity?",
        keywords: [
          "personal identity",
          "persists",
          "radical",
          "personality change",
          "self"
        ],
        explanation: "The passage implies that if personal identity is understood as something that persists through time, radical personality change challenges this by questioning whether the self before and after such a change can meaningfully be considered the same entity, mirroring the ship paradox of continuity through transformation."
      }
    ]
  },
  {
    id: "c2_2",
    level: "C2",
    title: "The Extended Mind",
    topic: "Cognitive Science",
    passage: "The philosopher Andy Clark and cognitive scientist David Chalmers proposed the 'extended mind' thesis in 1998, arguing that the mind is not confined to the skull. When external objects — notebooks, smartphones, or other people — become so reliably integrated into our cognitive processes that we would be cognitively impaired without them, those objects should be considered part of the mind. Critics object that this conflates the vehicle of thought with thought itself, and that genuine mental states must be intrinsic to the organism. The debate has practical implications for how we conceptualise cognitive enhancement, disability, and the ethics of memory modification.",
    questions: [
      {
        type: "mcq",
        q: "In what year did Clark and Chalmers first propose the 'extended mind' thesis?",
        options: [
          "1989",
          "1994",
          "1998",
          "2001"
        ],
        answer: 2,
        explanation: "The passage explicitly states the thesis was proposed 'in 1998'."
      },
      {
        type: "gap_word",
        sentence: "Clark is identified in the passage as a ___, while Chalmers is described as a cognitive scientist.",
        options: [
          "neuroscientist",
          "philosopher",
          "psychologist",
          "linguist"
        ],
        answer: 1,
        explanation: "The passage introduces Andy Clark as 'the philosopher Andy Clark', distinguishing his discipline from Chalmers's."
      },
      {
        type: "qa",
        q: "According to the passage, under what specific condition should an external object be considered part of the mind?",
        keywords: [
          "reliably integrated",
          "cognitively impaired",
          "cognitive processes"
        ],
        explanation: "The passage states that external objects qualify as part of the mind when they 'become so reliably integrated into our cognitive processes that we would be cognitively impaired without them'."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Clark and Chalmers both work in the same academic discipline.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage identifies Clark as a philosopher and Chalmers as a cognitive scientist, indicating different disciplines."
      },
      {
        type: "mcq",
        q: "Which of the following best captures the central objection that critics raise against the extended mind thesis?",
        options: [
          "External objects are too unreliable to serve cognitive functions.",
          "The thesis confuses the medium through which thought occurs with thought itself.",
          "Mental states cannot be studied through empirical means.",
          "The thesis ignores the role of social interaction in cognition."
        ],
        answer: 1,
        explanation: "Critics argue the thesis 'conflates the vehicle of thought with thought itself', which corresponds to option B."
      },
      {
        type: "gap_word",
        sentence: "Critics maintain that genuine mental states must be ___ to the organism, not distributed across external tools.",
        options: [
          "external",
          "peripheral",
          "intrinsic",
          "supplementary"
        ],
        answer: 2,
        explanation: "The passage states critics argue that 'genuine mental states must be intrinsic to the organism'."
      },
      {
        type: "qa",
        q: "What three domains of practical application does the passage identify as being affected by the extended mind debate?",
        keywords: [
          "cognitive enhancement",
          "disability",
          "memory modification"
        ],
        explanation: "The passage states the debate has implications for 'cognitive enhancement, disability, and the ethics of memory modification'."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The extended mind thesis has been universally accepted within academic philosophy.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly notes that 'critics object' to the thesis, indicating it has not been universally accepted."
      },
      {
        type: "mcq",
        q: "Which of the following is listed in the passage as an example of an external object that could potentially qualify as part of the extended mind?",
        options: [
          "A prosthetic limb",
          "A smartphone",
          "A neural implant",
          "A hearing aid"
        ],
        answer: 1,
        explanation: "The passage specifically lists 'notebooks, smartphones, or other people' as examples of potentially mind-extending external objects."
      },
      {
        type: "gap_word",
        sentence: "The extended mind thesis argues that the mind is not ___ to the skull.",
        options: [
          "adjacent",
          "confined",
          "restricted",
          "limited"
        ],
        answer: 1,
        explanation: "The passage uses the precise phrase 'the mind is not confined to the skull' when summarising the thesis."
      },
      {
        type: "qa",
        q: "How does the passage characterise 'other people' in the context of the extended mind thesis?",
        keywords: [
          "external objects",
          "cognitive processes",
          "integration"
        ],
        explanation: "The passage groups 'other people' alongside notebooks and smartphones as examples of external objects that, when reliably integrated into cognitive processes, may be considered part of the mind."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The ethics of memory modification is one of the practical areas the extended mind debate touches upon.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly lists 'the ethics of memory modification' among the practical implications of the debate."
      },
      {
        type: "mcq",
        q: "What does the passage imply about the relationship between cognitive impairment and the extended mind criterion?",
        options: [
          "Cognitive impairment disqualifies an individual from having an extended mind.",
          "The prospect of cognitive impairment without an object is a necessary condition for that object being part of the mind.",
          "Cognitive impairment is an irrelevant factor in determining the boundaries of the mind.",
          "Only clinically diagnosed cognitive impairment is relevant to the extended mind thesis."
        ],
        answer: 1,
        explanation: "The passage states objects qualify when 'we would be cognitively impaired without them', making potential impairment a necessary qualifying condition."
      },
      {
        type: "gap_word",
        sentence: "The passage states the debate has practical implications for how we ___ cognitive enhancement and disability.",
        options: [
          "measure",
          "treat",
          "conceptualise",
          "ignore"
        ],
        answer: 2,
        explanation: "The passage uses the word 'conceptualise' — 'implications for how we conceptualise cognitive enhancement, disability, and the ethics of memory modification'."
      },
      {
        type: "qa",
        q: "In precise terms, how do critics distinguish between what they consider legitimate mental states and the external objects described by Clark and Chalmers?",
        keywords: [
          "vehicle",
          "thought",
          "intrinsic",
          "organism"
        ],
        explanation: "Critics argue the thesis conflates 'the vehicle of thought with thought itself' and insist genuine mental states must be 'intrinsic to the organism', thereby drawing a boundary at the skin or skull of the individual."
      }
    ]
  },
  {
    id: "c2_3",
    level: "C2",
    title: "Epistemic Injustice",
    topic: "Philosophy",
    passage: "Miranda Fricker coined the term 'epistemic injustice' to describe wrongs done to individuals specifically in their capacity as knowers. She identifies two primary forms. The first, testimonial injustice, occurs when a speaker receives less credibility than they deserve due to prejudice — a Black witness being disbelieved in court, for instance. The second, hermeneutical injustice, arises when a gap in collective interpretive resources disadvantages a group — as when, before the concept of sexual harassment was named, victims had no framework to articulate their experiences. Both forms of injustice are self-concealing and compound existing social inequalities.",
    questions: [
      {
        type: "mcq",
        q: "Who is credited with coining the term 'epistemic injustice'?",
        options: [
          "A Black witness in court",
          "Miranda Fricker",
          "A collective of social theorists",
          "An unnamed victim of harassment"
        ],
        answer: 1,
        explanation: "The passage states explicitly: 'Miranda Fricker coined the term epistemic injustice.'"
      },
      {
        type: "gap_word",
        sentence: "Epistemic injustice describes wrongs done to individuals in their capacity as ___.",
        options: [
          "citizens",
          "witnesses",
          "knowers",
          "speakers"
        ],
        answer: 2,
        explanation: "The passage states the term describes 'wrongs done to individuals specifically in their capacity as knowers.'"
      },
      {
        type: "qa",
        q: "What does the passage identify as the defining mechanism of testimonial injustice?",
        keywords: [
          "credibility",
          "prejudice",
          "speaker",
          "deserves"
        ],
        explanation: "Testimonial injustice occurs when a speaker receives less credibility than they deserve due to prejudice, as illustrated by a Black witness being disbelieved in court."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Testimonial injustice exclusively affects individuals who appear in legal proceedings.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage uses a court case as an illustrative example but does not restrict testimonial injustice exclusively to legal contexts."
      },
      {
        type: "mcq",
        q: "According to the passage, what distinguishes hermeneutical injustice from testimonial injustice?",
        options: [
          "It targets speakers who lie deliberately",
          "It stems from a deficit in shared interpretive resources",
          "It requires a prejudiced individual to enact it",
          "It only affects witnesses in criminal trials"
        ],
        answer: 1,
        explanation: "The passage defines hermeneutical injustice as arising 'when a gap in collective interpretive resources disadvantages a group,' which is distinct from individual prejudice-based credibility denial."
      },
      {
        type: "gap_word",
        sentence: "Before sexual harassment was named, victims lacked a ___ to articulate their experiences.",
        options: [
          "lawyer",
          "framework",
          "platform",
          "precedent"
        ],
        answer: 1,
        explanation: "The passage states that victims 'had no framework to articulate their experiences' before the concept of sexual harassment was named."
      },
      {
        type: "qa",
        q: "Why does the passage describe both forms of epistemic injustice as 'self-concealing'?",
        keywords: [
          "self-concealing",
          "framework",
          "credibility",
          "compound"
        ],
        explanation: "The passage asserts both forms are self-concealing, implying they obscure their own existence — victims of hermeneutical injustice lack the concepts to identify what is happening to them, and testimonial injustice may be dismissed as normal prejudice, making both difficult to recognise and challenge."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Both testimonial injustice and hermeneutical injustice reinforce pre-existing social inequalities.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage concludes that 'both forms of injustice are self-concealing and compound existing social inequalities.'"
      },
      {
        type: "mcq",
        q: "In the context of the passage, what role does the naming of 'sexual harassment' serve as an example?",
        options: [
          "It illustrates how testimonial injustice can be remedied through legislation",
          "It demonstrates how credibility is denied due to racial prejudice",
          "It exemplifies a gap in interpretive resources that disadvantaged victims",
          "It shows how epistemic injustice can be self-concealing in legal settings"
        ],
        answer: 2,
        explanation: "The example is used to illustrate hermeneutical injustice: before the concept existed, victims had no interpretive framework, representing a gap in collective resources."
      },
      {
        type: "gap_word",
        sentence: "Both forms of epistemic injustice are described as self-concealing and ___ existing social inequalities.",
        options: [
          "resolving",
          "exposing",
          "compounding",
          "challenging"
        ],
        answer: 2,
        explanation: "The passage states both forms 'compound existing social inequalities,' meaning they worsen rather than resolve them."
      },
      {
        type: "qa",
        q: "How does the example of the Black witness in court illuminate the concept of testimonial injustice?",
        keywords: [
          "credibility",
          "prejudice",
          "disbelieved",
          "deserve"
        ],
        explanation: "The example shows a speaker receiving less credibility than deserved purely because of racial prejudice — the witness's testimony is discounted not on evidential grounds but due to bias, which is the defining feature of testimonial injustice."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Miranda Fricker proposes more than two primary forms of epistemic injustice in her work.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly states Fricker 'identifies two primary forms,' not more than two."
      },
      {
        type: "mcq",
        q: "Which of the following best captures what 'epistemic injustice' targets, as defined in the passage?",
        options: [
          "An individual's right to legal representation",
          "A person's capacity to function as a knower",
          "A group's access to political power",
          "A speaker's ability to understand prejudice"
        ],
        answer: 1,
        explanation: "The passage defines epistemic injustice as describing 'wrongs done to individuals specifically in their capacity as knowers.'"
      },
      {
        type: "gap_word",
        sentence: "Testimonial injustice occurs when a speaker receives less ___ than they deserve due to prejudice.",
        options: [
          "attention",
          "sympathy",
          "credibility",
          "support"
        ],
        answer: 2,
        explanation: "The passage states: 'testimonial injustice occurs when a speaker receives less credibility than they deserve due to prejudice.'"
      },
      {
        type: "qa",
        q: "In what way does hermeneutical injustice arise from a collective rather than an individual failing, according to the passage?",
        keywords: [
          "collective",
          "interpretive resources",
          "gap",
          "group"
        ],
        explanation: "Hermeneutical injustice arises from a gap in collective interpretive resources — meaning it is not attributable to one prejudiced person but to a shared social deficit in conceptual tools, which leaves an entire group unable to articulate or understand their own experiences."
      }
    ]
  },
  {
    id: "a1_4",
    level: "A1",
    title: "The Park",
    topic: "Recreation",
    passage: "I like to go to the park on weekends. The park is near my home. There are trees and flowers. I play with my friends. We run and play games. Sometimes we eat ice cream. The park is fun and quiet. Everyone enjoys the park.",
    questions: [
      {
        type: "mcq",
        q: "When does the person go to the park?",
        options: [
          "On weekdays",
          "On weekends",
          "Every morning",
          "On holidays"
        ],
        answer: 1,
        explanation: "The passage says 'I like to go to the park on weekends.'"
      },
      {
        type: "gap_word",
        sentence: "There are trees and ___ in the park.",
        options: [
          "birds",
          "benches",
          "flowers",
          "lakes"
        ],
        answer: 2,
        explanation: "The passage says 'There are trees and flowers.'"
      },
      {
        type: "qa",
        q: "What do the friends do at the park?",
        keywords: [
          "run",
          "play",
          "games"
        ],
        explanation: "The passage says 'We run and play games.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The park is far from the person's home.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says 'The park is near my home,' so it is not far."
      },
      {
        type: "mcq",
        q: "What do they sometimes eat at the park?",
        options: [
          "Cake",
          "Fruit",
          "Ice cream",
          "Sandwiches"
        ],
        answer: 2,
        explanation: "The passage says 'Sometimes we eat ice cream.'"
      }
    ]
  },
  {
    id: "a2_4",
    level: "A2",
    title: "The Hobby",
    topic: "Interests",
    passage: "My hobby is painting. I paint pictures on weekends. I use bright colours like blue, red, and yellow. My friends think my paintings are beautiful. I show my paintings to my family. They are very proud of me. Painting helps me relax and express my feelings. I want to paint all the time.",
    questions: [
      {
        type: "mcq",
        q: "When does the writer paint pictures?",
        options: [
          "Every day",
          "On weekdays",
          "On weekends",
          "In the mornings"
        ],
        answer: 2,
        explanation: "The passage says 'I paint pictures on weekends.'"
      },
      {
        type: "gap_word",
        sentence: "The writer uses bright ___ like blue, red, and yellow.",
        options: [
          "brushes",
          "paper",
          "colours",
          "shapes"
        ],
        answer: 2,
        explanation: "The passage says 'I use bright colours like blue, red, and yellow.'"
      },
      {
        type: "qa",
        q: "How does painting make the writer feel?",
        keywords: [
          "relax",
          "feelings",
          "express"
        ],
        explanation: "Painting helps the writer relax and express their feelings, as stated in the passage."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The writer sells paintings to friends.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage says friends think the paintings are beautiful, but nothing is said about selling them."
      },
      {
        type: "mcq",
        q: "How does the writer's family feel about the paintings?",
        options: [
          "They are angry.",
          "They are proud.",
          "They are bored.",
          "They are worried."
        ],
        answer: 1,
        explanation: "The passage says 'They are very proud of me.'"
      },
      {
        type: "gap_word",
        sentence: "The writer shows paintings to his ___.",
        options: [
          "teacher",
          "neighbours",
          "family",
          "classmates"
        ],
        answer: 2,
        explanation: "The passage says 'I show my paintings to my family.'"
      }
    ]
  },
  {
    id: "b1_4",
    level: "B1",
    title: "Learning Languages",
    topic: "Education",
    passage: "Learning a second language is an exciting challenge. Many people decide to learn English, Spanish, or Mandarin. Different methods work for different people. Some prefer classroom instruction, while others learn through apps and online resources. Consistency is key to progress. Regular practice helps build vocabulary and grammar skills. Immersion in the language—through movies, music, and conversations—accelerates learning. Motivation and patience are essential for success.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, which of the following is a popular language people choose to learn?",
        options: [
          "French",
          "Spanish",
          "Japanese",
          "Arabic"
        ],
        answer: 1,
        explanation: "The passage states that 'Many people decide to learn English, Spanish, or Mandarin,' so Spanish is correct."
      },
      {
        type: "gap_word",
        sentence: "Regular practice helps build vocabulary and ___ skills.",
        options: [
          "speaking",
          "reading",
          "grammar",
          "writing"
        ],
        answer: 2,
        explanation: "The passage says 'Regular practice helps build vocabulary and grammar skills.'"
      },
      {
        type: "qa",
        q: "What does the passage say about immersion in a language?",
        keywords: [
          "movies",
          "music",
          "conversations",
          "accelerates"
        ],
        explanation: "The passage states that immersion through movies, music, and conversations accelerates learning."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Motivation and patience are essential for success in learning a language.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage clearly states that 'Motivation and patience are essential for success.'"
      },
      {
        type: "mcq",
        q: "What does the passage say is key to making progress in a language?",
        options: [
          "Having a teacher",
          "Consistency",
          "Buying textbooks",
          "Travelling abroad"
        ],
        answer: 1,
        explanation: "The passage states 'Consistency is key to progress.'"
      },
      {
        type: "gap_word",
        sentence: "Learning a second language is an exciting ___.",
        options: [
          "hobby",
          "task",
          "challenge",
          "decision"
        ],
        answer: 2,
        explanation: "The passage opens with 'Learning a second language is an exciting challenge.'"
      },
      {
        type: "qa",
        q: "How do some people prefer to learn a language instead of going to a classroom?",
        keywords: [
          "apps",
          "online",
          "resources"
        ],
        explanation: "The passage says some people 'learn through apps and online resources' rather than classroom instruction."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Classroom instruction is the best method for learning a language.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says 'Different methods work for different people,' suggesting no single method is best."
      }
    ]
  },
  {
    id: "b2_4",
    level: "B2",
    title: "Digital Privacy",
    topic: "Technology",
    passage: "The digital age has transformed how we communicate, work, and live. However, it has also introduced new challenges regarding privacy. Tech companies collect vast amounts of user data for targeted advertising and algorithmic curation. Many users are unaware of the extent to which their information is tracked across platforms. Privacy policies are often lengthy and written in complex language that discourages reading. Regulations like GDPR attempt to protect personal information, yet enforcement remains inconsistent. Individuals should be proactive: use strong passwords, enable two-factor authentication, and review privacy settings regularly.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, why do tech companies collect user data?",
        options: [
          "To improve user experience",
          "For targeted advertising and algorithmic curation",
          "To comply with government regulations",
          "To create stronger privacy policies"
        ],
        answer: 1,
        explanation: "The passage states that 'Tech companies collect vast amounts of user data for targeted advertising and algorithmic curation.'"
      },
      {
        type: "gap_word",
        sentence: "Privacy policies are often lengthy and written in ___ language that discourages reading.",
        options: [
          "simple",
          "foreign",
          "complex",
          "informal"
        ],
        answer: 2,
        explanation: "The passage states that privacy policies are 'written in complex language that discourages reading.'"
      },
      {
        type: "qa",
        q: "What personal actions does the passage recommend to protect your privacy online?",
        keywords: [
          "passwords",
          "two-factor authentication",
          "privacy settings"
        ],
        explanation: "The passage advises individuals to use strong passwords, enable two-factor authentication, and review privacy settings regularly."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Most users are fully aware of how their data is tracked across different platforms.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that 'Many users are unaware of the extent to which their information is tracked across platforms,' which contradicts this statement."
      },
      {
        type: "mcq",
        q: "What problem does the passage identify with regulations like GDPR?",
        options: [
          "They do not cover enough countries",
          "They are too expensive to implement",
          "Their enforcement remains inconsistent",
          "They are written in complex language"
        ],
        answer: 2,
        explanation: "The passage says that regulations like GDPR 'attempt to protect personal information, yet enforcement remains inconsistent.'"
      },
      {
        type: "gap_word",
        sentence: "The digital age has transformed how we communicate, work, and ___ .",
        options: [
          "travel",
          "study",
          "live",
          "earn"
        ],
        answer: 2,
        explanation: "The passage opens by stating that 'The digital age has transformed how we communicate, work, and live.'"
      },
      {
        type: "qa",
        q: "Why might people fail to read privacy policies, according to the passage?",
        keywords: [
          "lengthy",
          "complex",
          "discourages"
        ],
        explanation: "According to the passage, privacy policies are often lengthy and written in complex language, which discourages people from reading them."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "GDPR is described as a regulation that successfully eliminates all privacy violations.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says GDPR 'attempts to protect personal information, yet enforcement remains inconsistent,' indicating it does not fully eliminate violations."
      },
      {
        type: "mcq",
        q: "What broader impact of the digital age does the passage highlight beyond communication and work?",
        options: [
          "It has improved education systems worldwide",
          "It has introduced new challenges regarding privacy",
          "It has reduced the need for personal data",
          "It has simplified government regulations"
        ],
        answer: 1,
        explanation: "The passage states that the digital age 'has also introduced new challenges regarding privacy.'"
      },
      {
        type: "gap_word",
        sentence: "Individuals should be ___: use strong passwords, enable two-factor authentication, and review privacy settings regularly.",
        options: [
          "cautious",
          "proactive",
          "reactive",
          "dependent"
        ],
        answer: 1,
        explanation: "The passage advises that 'Individuals should be proactive' and lists specific steps they can take to protect their privacy."
      }
    ]
  },
  {
    id: "c1_4",
    level: "C1",
    title: "Cognitive Biases",
    topic: "Psychology",
    passage: "Cognitive biases are systematic patterns in how humans process information and make decisions. They arise from the brain's need to simplify complex environments through heuristics—mental shortcuts. Common examples include confirmation bias (seeking information that confirms existing beliefs), availability heuristic (overweighting accessible information), and anchoring (relying heavily on initial information). These biases are not character flaws but evolutionary adaptations that generally served humans well in ancestral environments. However, in modern contexts involving large datasets and probabilistic reasoning, they often lead to suboptimal decisions. Understanding one's biases is the first step toward mitigating their effects.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what is the primary reason cognitive biases develop in the human brain?",
        options: [
          "To improve probabilistic reasoning",
          "To simplify complex environments through mental shortcuts",
          "To help humans process large datasets",
          "To reinforce existing character traits"
        ],
        answer: 1,
        explanation: "The passage states that biases 'arise from the brain's need to simplify complex environments through heuristics—mental shortcuts.'"
      },
      {
        type: "gap_word",
        sentence: "Confirmation bias involves seeking information that ___ existing beliefs.",
        options: [
          "challenges",
          "replaces",
          "confirms",
          "ignores"
        ],
        answer: 2,
        explanation: "The passage defines confirmation bias as 'seeking information that confirms existing beliefs.'"
      },
      {
        type: "qa",
        q: "In what types of modern contexts do cognitive biases most frequently lead to poor decisions, according to the passage?",
        keywords: [
          "datasets",
          "probabilistic",
          "reasoning",
          "suboptimal"
        ],
        explanation: "The passage states that in 'modern contexts involving large datasets and probabilistic reasoning,' cognitive biases 'often lead to suboptimal decisions.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Cognitive biases are considered character flaws that reflect poorly on an individual's intelligence.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly states that 'these biases are not character flaws but evolutionary adaptations.'"
      },
      {
        type: "mcq",
        q: "Which of the following best describes the anchoring bias as presented in the passage?",
        options: [
          "Overweighting the most recently encountered information",
          "Placing excessive reliance on information encountered first",
          "Dismissing information that contradicts prior knowledge",
          "Favouring information that is emotionally resonant"
        ],
        answer: 1,
        explanation: "The passage defines anchoring as 'relying heavily on initial information,' meaning the first piece of information encountered."
      },
      {
        type: "gap_word",
        sentence: "Cognitive biases are described in the passage as evolutionary ___ that served humans well in ancestral environments.",
        options: [
          "flaws",
          "shortcuts",
          "adaptations",
          "instincts"
        ],
        answer: 2,
        explanation: "The passage refers to biases as 'evolutionary adaptations that generally served humans well in ancestral environments.'"
      },
      {
        type: "qa",
        q: "How does the passage characterise the relationship between heuristics and cognitive biases?",
        keywords: [
          "heuristics",
          "mental shortcuts",
          "simplify",
          "arise"
        ],
        explanation: "The passage explains that cognitive biases arise from heuristics, which are mental shortcuts the brain uses to simplify complex environments, implying heuristics are the mechanism through which biases emerge."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The availability heuristic involves giving excessive weight to information that is easily accessible or comes to mind readily.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage defines the availability heuristic as 'overweighting accessible information,' which aligns with the statement."
      },
      {
        type: "mcq",
        q: "What does the passage suggest is the first step in reducing the negative impact of cognitive biases?",
        options: [
          "Avoiding complex decision-making environments",
          "Relying more heavily on probabilistic reasoning",
          "Developing an awareness of one's own biases",
          "Replacing heuristics with systematic data analysis"
        ],
        answer: 2,
        explanation: "The passage concludes that 'understanding one's biases is the first step toward mitigating their effects.'"
      },
      {
        type: "gap_word",
        sentence: "The availability heuristic leads people to ___ information that is most accessible to them.",
        options: [
          "underestimate",
          "overweight",
          "discard",
          "verify"
        ],
        answer: 1,
        explanation: "The passage describes the availability heuristic as 'overweighting accessible information.'"
      },
      {
        type: "qa",
        q: "Why, according to the passage, were cognitive biases generally beneficial to humans despite sometimes leading to poor outcomes today?",
        keywords: [
          "ancestral",
          "evolutionary",
          "adaptations",
          "environments"
        ],
        explanation: "The passage states they were 'evolutionary adaptations that generally served humans well in ancestral environments,' suggesting they were well-suited to earlier, less complex contexts even if they are less effective now."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The passage recommends specific therapeutic techniques for overcoming cognitive biases.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage only states that understanding one's biases is the first step toward mitigation; no specific therapeutic techniques are mentioned."
      }
    ]
  },
  {
    id: "c2_4",
    level: "C2",
    title: "Phenomenology",
    topic: "Philosophy",
    passage: "Phenomenology, as developed by Edmund Husserl, is the study of consciousness and subjective experience. It emphasizes the essential structures of experience—how objects appear to consciousness through intentionality. Rather than seeking objective truth independent of observers, phenomenology examines the structures through which meaning is constituted. Maurice Merleau-Ponty extended phenomenology by emphasizing embodiment: experience is always mediated through the body, not disembodied consciousness. Contemporary phenomenology engages with intersubjectivity—how shared meaning emerges through social interaction. Critics argue phenomenology lacks empirical rigor, yet proponents contend it clarifies foundational questions about consciousness that neuroscience alone cannot address.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what is the central focus of phenomenology as Husserl conceived it?",
        options: [
          "The pursuit of objective truth independent of any observer",
          "The examination of consciousness and the structures of subjective experience",
          "The empirical investigation of neural correlates of awareness",
          "The analysis of social interaction and shared cultural meaning"
        ],
        answer: 1,
        explanation: "The passage states that phenomenology 'is the study of consciousness and subjective experience' and 'examines the structures through which meaning is constituted.'"
      },
      {
        type: "gap_word",
        sentence: "Phenomenology holds that objects appear to consciousness through the mechanism of ___.",
        options: [
          "embodiment",
          "intersubjectivity",
          "intentionality",
          "empiricism"
        ],
        answer: 2,
        explanation: "The passage explicitly states that objects 'appear to consciousness through intentionality,' identifying it as the key mechanism."
      },
      {
        type: "qa",
        q: "In what fundamental way did Merleau-Ponty's contribution alter or extend the phenomenological tradition?",
        keywords: [
          "embodiment",
          "body",
          "mediated",
          "disembodied"
        ],
        explanation: "Merleau-Ponty extended phenomenology by foregrounding embodiment, arguing that experience is always mediated through the body rather than through a disembodied consciousness."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Husserl and Merleau-Ponty collaborated directly on the concept of embodiment.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage mentions both thinkers separately but says nothing about any direct collaboration between them."
      },
      {
        type: "mcq",
        q: "How does contemporary phenomenology, as described in the passage, engage with questions of shared meaning?",
        options: [
          "By adopting strict neuroscientific methodologies",
          "By rejecting the role of the body in cognition",
          "By examining intersubjectivity and how meaning emerges through social interaction",
          "By returning to Husserl's original rejection of empirical methods"
        ],
        answer: 2,
        explanation: "The passage states that 'contemporary phenomenology engages with intersubjectivity—how shared meaning emerges through social interaction.'"
      },
      {
        type: "gap_word",
        sentence: "Merleau-Ponty argued that experience is always ___ through the body.",
        options: [
          "constructed",
          "mediated",
          "eliminated",
          "abstracted"
        ],
        answer: 1,
        explanation: "The passage uses the word 'mediated' specifically: 'experience is always mediated through the body.'"
      },
      {
        type: "qa",
        q: "What criticism do detractors level at phenomenology, and how do its proponents respond to this charge?",
        keywords: [
          "empirical rigor",
          "foundational",
          "consciousness",
          "neuroscience"
        ],
        explanation: "Critics argue that phenomenology lacks empirical rigor, while proponents counter that it addresses foundational questions about consciousness that neuroscience alone is insufficient to resolve."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Proponents of phenomenology claim it can entirely replace neuroscience in the study of consciousness.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "Proponents only claim phenomenology 'clarifies foundational questions... that neuroscience alone cannot address,' not that it replaces neuroscience altogether."
      },
      {
        type: "mcq",
        q: "Which of the following best characterises phenomenology's stance toward objective truth, as outlined in the passage?",
        options: [
          "It seeks objective truth by eliminating the observer's perspective entirely",
          "It regards objective truth as the ultimate goal of philosophical inquiry",
          "It deliberately sets aside the pursuit of observer-independent objective truth",
          "It equates objective truth with the findings of contemporary neuroscience"
        ],
        answer: 2,
        explanation: "The passage contrasts phenomenology with approaches 'seeking objective truth independent of observers,' implying phenomenology deliberately forgoes this goal."
      },
      {
        type: "gap_word",
        sentence: "Contemporary phenomenology explores ___, examining how meaning is jointly constructed through social relations.",
        options: [
          "empiricism",
          "intersubjectivity",
          "neuroscience",
          "intentionality"
        ],
        answer: 1,
        explanation: "The passage describes contemporary phenomenology as engaging with 'intersubjectivity—how shared meaning emerges through social interaction.'"
      },
      {
        type: "qa",
        q: "What does the passage suggest about the relationship between phenomenology and neuroscience with regard to questions of consciousness?",
        keywords: [
          "foundational",
          "neuroscience",
          "cannot address",
          "clarifies"
        ],
        explanation: "The passage implies a complementary tension: proponents argue phenomenology clarifies foundational questions about consciousness that neuroscience alone is incapable of addressing, suggesting the two disciplines occupy different but related domains."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Intersubjectivity in phenomenology refers to how individual consciousness generates meaning in isolation.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage defines intersubjectivity as 'how shared meaning emerges through social interaction,' which is the opposite of meaning generated in isolation."
      },
      {
        type: "mcq",
        q: "Which philosopher is identified in the passage as the originator of phenomenology?",
        options: [
          "Maurice Merleau-Ponty",
          "Edmund Husserl",
          "Martin Heidegger",
          "Jean-Paul Sartre"
        ],
        answer: 1,
        explanation: "The passage opens by naming Edmund Husserl as the figure by whom phenomenology 'was developed.'"
      },
      {
        type: "gap_word",
        sentence: "Critics contend that phenomenology lacks empirical ___, questioning its standing as a rigorous discipline.",
        options: [
          "embodiment",
          "intentionality",
          "rigor",
          "intersubjectivity"
        ],
        answer: 2,
        explanation: "The passage states explicitly: 'Critics argue phenomenology lacks empirical rigor.'"
      },
      {
        type: "qa",
        q: "How does the passage characterise the concept of intentionality within phenomenological inquiry?",
        keywords: [
          "intentionality",
          "objects",
          "appear",
          "consciousness"
        ],
        explanation: "According to the passage, intentionality is the mechanism through which objects appear to consciousness; it is presented as one of the essential structures of experience that phenomenology seeks to examine."
      }
    ]
  },
  {
    id: "a1_5",
    level: "A1",
    title: "My Bedroom",
    topic: "Home",
    passage: "My bedroom is small but nice. I have a bed, a desk, and a chair. My desk is by the window. I do my homework at my desk. My bed is soft and warm. I sleep very well at night. I have some books on a shelf. I also have a toy box. I love my bedroom very much.",
    questions: [
      {
        type: "mcq",
        q: "Where is the desk?",
        options: [
          "By the door",
          "By the window",
          "By the bed",
          "By the shelf"
        ],
        answer: 1,
        explanation: "The passage says 'My desk is by the window.'"
      },
      {
        type: "gap_word",
        sentence: "I have some books on a ___.",
        options: [
          "desk",
          "bed",
          "shelf",
          "chair"
        ],
        answer: 2,
        explanation: "The passage says 'I have some books on a shelf.'"
      },
      {
        type: "qa",
        q: "What does the person do at the desk?",
        keywords: [
          "homework",
          "desk",
          "do"
        ],
        explanation: "The passage says 'I do my homework at my desk.' so the answer is: They do their homework."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The bed is soft and warm.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'My bed is soft and warm.'"
      },
      {
        type: "mcq",
        q: "What is in the bedroom with the books?",
        options: [
          "A lamp",
          "A toy box",
          "A window",
          "A bag"
        ],
        answer: 1,
        explanation: "The passage says 'I also have a toy box,' which is in the bedroom along with the books."
      }
    ]
  },
  {
    id: "a1_6",
    level: "A1",
    title: "The Weather",
    topic: "Nature",
    passage: "Today the weather is sunny. The sky is blue and there are no clouds. It is warm but not hot. I put on a T-shirt and shorts. My mother opens the windows. We go for a walk in the garden. The flowers look beautiful in the sunshine. I am very happy today.",
    questions: [
      {
        type: "mcq",
        q: "What is the weather like today?",
        options: [
          "Rainy",
          "Sunny",
          "Cloudy",
          "Cold"
        ],
        answer: 1,
        explanation: "The passage says 'Today the weather is sunny.'"
      },
      {
        type: "gap_word",
        sentence: "I put on a T-shirt and ___.",
        options: [
          "shoes",
          "jacket",
          "shorts",
          "hat"
        ],
        answer: 2,
        explanation: "The passage says 'I put on a T-shirt and shorts.'"
      },
      {
        type: "qa",
        q: "Where do they go for a walk?",
        keywords: [
          "garden",
          "walk",
          "go"
        ],
        explanation: "The passage says 'We go for a walk in the garden.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The sky has many clouds.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says 'there are no clouds', so this is false."
      },
      {
        type: "mcq",
        q: "What does the person's mother do?",
        options: [
          "She makes food.",
          "She opens the windows.",
          "She waters the flowers.",
          "She puts on a T-shirt."
        ],
        answer: 1,
        explanation: "The passage says 'My mother opens the windows.'"
      }
    ]
  },
  {
    id: "a1_7",
    level: "A1",
    title: "Breakfast Time",
    topic: "Food",
    passage: "Every morning I eat breakfast at seven o'clock. I have bread, butter, and a glass of milk. Sometimes I eat an egg. My mother makes breakfast for the family. We all sit at the table. My father drinks coffee. My sister eats cereal. Breakfast is my favourite meal of the day.",
    questions: [
      {
        type: "mcq",
        q: "What time does the writer eat breakfast?",
        options: [
          "Six o'clock",
          "Seven o'clock",
          "Eight o'clock",
          "Nine o'clock"
        ],
        answer: 1,
        explanation: "The passage says 'Every morning I eat breakfast at seven o'clock.'"
      },
      {
        type: "gap_word",
        sentence: "My ___ makes breakfast for the family.",
        options: [
          "sister",
          "father",
          "mother",
          "brother"
        ],
        answer: 2,
        explanation: "The passage says 'My mother makes breakfast for the family.'"
      },
      {
        type: "qa",
        q: "What does the writer's father drink at breakfast?",
        keywords: [
          "father",
          "drinks",
          "coffee"
        ],
        explanation: "The passage says 'My father drinks coffee,' so the answer is coffee."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The writer's sister eats cereal for breakfast.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'My sister eats cereal,' so this is true."
      },
      {
        type: "mcq",
        q: "What is the writer's favourite meal of the day?",
        options: [
          "Lunch",
          "Dinner",
          "Breakfast",
          "Supper"
        ],
        answer: 2,
        explanation: "The passage says 'Breakfast is my favourite meal of the day.'"
      }
    ]
  },
  {
    id: "a1_8",
    level: "A1",
    title: "My Pet",
    topic: "Animals",
    passage: "I have a cat. Her name is Mimi. Mimi is white and orange. She is very soft. I feed her every morning. She likes fish and milk. Mimi sleeps on the sofa all day. At night she sleeps in my room. I love Mimi. She is my best friend.",
    questions: [
      {
        type: "mcq",
        q: "What color is Mimi?",
        options: [
          "Black and white",
          "White and orange",
          "Brown and white",
          "Orange and black"
        ],
        answer: 1,
        explanation: "The passage says 'Mimi is white and orange.'"
      },
      {
        type: "gap_word",
        sentence: "Mimi sleeps on the ___ all day.",
        options: [
          "bed",
          "floor",
          "sofa",
          "chair"
        ],
        answer: 2,
        explanation: "The passage says 'Mimi sleeps on the sofa all day.'"
      },
      {
        type: "qa",
        q: "What food does Mimi like?",
        keywords: [
          "fish",
          "milk"
        ],
        explanation: "The passage says 'She likes fish and milk.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The writer feeds Mimi every morning.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'I feed her every morning.'"
      },
      {
        type: "mcq",
        q: "Where does Mimi sleep at night?",
        options: [
          "On the sofa",
          "In the garden",
          "In the writer's room",
          "In the kitchen"
        ],
        answer: 2,
        explanation: "The passage says 'At night she sleeps in my room.'"
      }
    ]
  },
  {
    id: "a1_9",
    level: "A1",
    title: "A Birthday Party",
    topic: "Celebrations",
    passage: "Today is my birthday. I am seven years old. My mother makes a big cake. The cake is chocolate. My friends come to my house. We play games and sing songs. My friend gives me a toy car. I am very happy. We eat cake and drink juice. It is a great day!",
    questions: [
      {
        type: "mcq",
        q: "How old is the child today?",
        options: [
          "Five",
          "Six",
          "Seven",
          "Eight"
        ],
        answer: 2,
        explanation: "The passage says 'I am seven years old.'"
      },
      {
        type: "gap_word",
        sentence: "The cake is ___.",
        options: [
          "vanilla",
          "strawberry",
          "chocolate",
          "lemon"
        ],
        answer: 2,
        explanation: "The passage says 'The cake is chocolate.'"
      },
      {
        type: "qa",
        q: "What do the children drink at the party?",
        keywords: [
          "drink",
          "juice"
        ],
        explanation: "The passage says 'We eat cake and drink juice,' so the children drink juice."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "A friend gives the child a toy car.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'My friend gives me a toy car.'"
      },
      {
        type: "mcq",
        q: "What do the friends do at the party?",
        options: [
          "Watch a film",
          "Play games and sing songs",
          "Read books",
          "Draw pictures"
        ],
        answer: 1,
        explanation: "The passage says 'We play games and sing songs.'"
      }
    ]
  },
  {
    id: "a1_10",
    level: "A1",
    title: "The Seasons",
    topic: "Nature",
    passage: "There are four seasons in a year. They are spring, summer, autumn, and winter. In spring the flowers grow. In summer it is hot and sunny. In autumn the leaves fall from the trees. In winter it is cold and sometimes it snows. I like summer because I can swim. What is your favourite season?",
    questions: [
      {
        type: "mcq",
        q: "How many seasons are in a year?",
        options: [
          "Two",
          "Three",
          "Four",
          "Five"
        ],
        answer: 2,
        explanation: "The passage says 'There are four seasons in a year.'"
      },
      {
        type: "gap_word",
        sentence: "In autumn the ___ fall from the trees.",
        options: [
          "flowers",
          "snow",
          "leaves",
          "rain"
        ],
        answer: 2,
        explanation: "The passage says 'In autumn the leaves fall from the trees.'"
      },
      {
        type: "qa",
        q: "Why does the writer like summer?",
        keywords: [
          "swim",
          "summer",
          "like"
        ],
        explanation: "The writer likes summer because they can swim. The passage says 'I like summer because I can swim.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "In winter it is cold and sometimes it snows.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'In winter it is cold and sometimes it snows.'"
      },
      {
        type: "mcq",
        q: "What happens in spring?",
        options: [
          "It snows",
          "It is hot",
          "The flowers grow",
          "The leaves fall"
        ],
        answer: 2,
        explanation: "The passage says 'In spring the flowers grow.'"
      }
    ]
  },
  {
    id: "a2_5",
    level: "A2",
    title: "A Trip to the Zoo",
    topic: "Animals",
    passage: "Last Sunday, my family went to the zoo. We saw many animals — lions, elephants, and giraffes. The giraffes were my favourite because they were so tall. We also watched a dolphin show. The dolphins jumped high out of the water. After the show, we ate sandwiches in the park. It was a wonderful day. I want to go back next year.",
    questions: [
      {
        type: "mcq",
        q: "Why did the writer like the giraffes the most?",
        options: [
          "They were very fast.",
          "They were so tall.",
          "They were very funny.",
          "They were very loud."
        ],
        answer: 1,
        explanation: "The passage says 'The giraffes were my favourite because they were so tall.'"
      },
      {
        type: "gap_word",
        sentence: "The dolphins jumped high out of the ___.",
        options: [
          "air",
          "tank",
          "water",
          "ground"
        ],
        answer: 2,
        explanation: "The passage says 'The dolphins jumped high out of the water.'"
      },
      {
        type: "qa",
        q: "What did the family eat after the dolphin show?",
        keywords: [
          "sandwiches",
          "park",
          "ate"
        ],
        explanation: "After the dolphin show, the family ate sandwiches in the park."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The family went to the zoo on a Saturday.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says they went 'Last Sunday', not Saturday."
      },
      {
        type: "mcq",
        q: "What show did the family watch at the zoo?",
        options: [
          "A lion show",
          "An elephant show",
          "A dolphin show",
          "A giraffe show"
        ],
        answer: 2,
        explanation: "The passage says 'We also watched a dolphin show.'"
      },
      {
        type: "gap_word",
        sentence: "The writer wants to go back to the zoo next ___.",
        options: [
          "week",
          "month",
          "day",
          "year"
        ],
        answer: 3,
        explanation: "The passage says 'I want to go back next year.'"
      }
    ]
  },
  {
    id: "a2_6",
    level: "A2",
    title: "Learning to Ride a Bike",
    topic: "Sport",
    passage: "When I was six, my father taught me to ride a bike. It was very difficult at first. I fell down many times. But my father always helped me. He held the bike and ran beside me. After one week of practice, I could ride alone. I was so proud of myself. Now I cycle to school every day. It is my favourite way to travel.",
    questions: [
      {
        type: "mcq",
        q: "How old was the writer when they learned to ride a bike?",
        options: [
          "Five",
          "Six",
          "Seven",
          "Eight"
        ],
        answer: 1,
        explanation: "The passage says 'When I was six, my father taught me to ride a bike.'"
      },
      {
        type: "gap_word",
        sentence: "The writer's father held the bike and ___ beside them.",
        options: [
          "walked",
          "jumped",
          "ran",
          "stopped"
        ],
        answer: 2,
        explanation: "The passage says 'He held the bike and ran beside me.'"
      },
      {
        type: "qa",
        q: "How did the writer feel after they could ride the bike alone?",
        keywords: [
          "proud",
          "happy",
          "themselves"
        ],
        explanation: "The writer felt very proud. The passage says 'I was so proud of myself.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The writer learned to ride a bike after one week of practice.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'After one week of practice, I could ride alone.'"
      },
      {
        type: "mcq",
        q: "How does the writer travel to school now?",
        options: [
          "By bus",
          "By car",
          "By bike",
          "On foot"
        ],
        answer: 2,
        explanation: "The passage says 'Now I cycle to school every day.'"
      },
      {
        type: "gap_word",
        sentence: "At first, learning to ride a bike was very ___.",
        options: [
          "easy",
          "fun",
          "difficult",
          "boring"
        ],
        answer: 2,
        explanation: "The passage says 'It was very difficult at first.'"
      }
    ]
  },
  {
    id: "a2_7",
    level: "A2",
    title: "The Library",
    topic: "Education",
    passage: "There is a big library in my town. I go there every Saturday. The library has thousands of books. I love reading adventure stories. I can also borrow DVDs and magazines. The librarian is very kind. She always helps me find the right book. I can stay in the library for hours. Reading makes me feel happy and calm.",
    questions: [
      {
        type: "mcq",
        q: "When does the writer go to the library?",
        options: [
          "Every Sunday",
          "Every Saturday",
          "Every Friday",
          "Every Monday"
        ],
        answer: 1,
        explanation: "The passage says 'I go there every Saturday.'"
      },
      {
        type: "gap_word",
        sentence: "The writer loves reading ___ stories.",
        options: [
          "funny",
          "scary",
          "adventure",
          "history"
        ],
        answer: 2,
        explanation: "The passage says 'I love reading adventure stories.'"
      },
      {
        type: "qa",
        q: "What can the writer borrow from the library besides books?",
        keywords: [
          "DVDs",
          "magazines",
          "borrow"
        ],
        explanation: "The writer can borrow DVDs and magazines from the library."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The librarian is a man.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says 'She always helps me,' so the librarian is a woman, not a man."
      },
      {
        type: "mcq",
        q: "How does reading make the writer feel?",
        options: [
          "Excited and nervous",
          "Bored and tired",
          "Happy and calm",
          "Sad and quiet"
        ],
        answer: 2,
        explanation: "The passage says 'Reading makes me feel happy and calm.'"
      },
      {
        type: "gap_word",
        sentence: "The library has thousands of ___.",
        options: [
          "DVDs",
          "magazines",
          "computers",
          "books"
        ],
        answer: 3,
        explanation: "The passage says 'The library has thousands of books.'"
      }
    ]
  },
  {
    id: "a2_8",
    level: "A2",
    title: "A Rainy Day",
    topic: "Daily Life",
    passage: "Yesterday it rained all day. I could not go outside. In the morning I read a book and listened to music. In the afternoon my sister and I played board games. We laughed a lot. My mother made soup for lunch. It was warm and delicious. By evening the rain stopped. I went outside and saw a beautiful rainbow. It was a lovely surprise.",
    questions: [
      {
        type: "mcq",
        q: "What did the writer do in the morning?",
        options: [
          "Played board games",
          "Read a book and listened to music",
          "Made soup",
          "Went outside"
        ],
        answer: 1,
        explanation: "The passage says 'In the morning I read a book and listened to music.'"
      },
      {
        type: "gap_word",
        sentence: "The writer's mother made ___ for lunch.",
        options: [
          "pizza",
          "soup",
          "bread",
          "salad"
        ],
        answer: 1,
        explanation: "The passage states 'My mother made soup for lunch.'"
      },
      {
        type: "qa",
        q: "What did the writer see when they went outside in the evening?",
        keywords: [
          "rainbow",
          "beautiful",
          "surprise"
        ],
        explanation: "The writer went outside and saw a beautiful rainbow, which was a lovely surprise."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The writer and her sister laughed a lot while playing board games.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'my sister and I played board games. We laughed a lot.'"
      },
      {
        type: "mcq",
        q: "When did the rain stop?",
        options: [
          "In the morning",
          "At lunchtime",
          "In the afternoon",
          "By evening"
        ],
        answer: 3,
        explanation: "The passage says 'By evening the rain stopped.'"
      },
      {
        type: "gap_word",
        sentence: "The writer could not go ___ because it rained all day.",
        options: [
          "upstairs",
          "outside",
          "shopping",
          "home"
        ],
        answer: 1,
        explanation: "The passage states 'I could not go outside' because of the rain."
      }
    ]
  },
  {
    id: "a2_9",
    level: "A2",
    title: "My Favourite Food",
    topic: "Food",
    passage: "My favourite food is pizza. I eat it every Friday with my family. We order pizza from a restaurant near our house. I like pizza with cheese and vegetables. My brother prefers pizza with meat. We always share a big pizza together. My mother makes a salad. We drink juice or water. Friday dinner is my favourite time of the week.",
    questions: [
      {
        type: "mcq",
        q: "When does the writer eat pizza with their family?",
        options: [
          "Every Monday",
          "Every Friday",
          "Every Saturday",
          "Every Sunday"
        ],
        answer: 1,
        explanation: "The passage says 'I eat it every Friday with my family.'"
      },
      {
        type: "gap_word",
        sentence: "The writer likes pizza with cheese and ___.",
        options: [
          "meat",
          "fruit",
          "vegetables",
          "salad"
        ],
        answer: 2,
        explanation: "The passage says 'I like pizza with cheese and vegetables.'"
      },
      {
        type: "qa",
        q: "What does the writer's mother do at Friday dinner?",
        keywords: [
          "mother",
          "makes",
          "salad"
        ],
        explanation: "The writer's mother makes a salad, as stated in the passage: 'My mother makes a salad.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The family orders pizza from a restaurant near their house.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage clearly states 'We order pizza from a restaurant near our house.'"
      },
      {
        type: "mcq",
        q: "What does the writer's brother prefer on his pizza?",
        options: [
          "Cheese",
          "Vegetables",
          "Salad",
          "Meat"
        ],
        answer: 3,
        explanation: "The passage says 'My brother prefers pizza with meat.'"
      },
      {
        type: "gap_word",
        sentence: "The family drinks juice or ___ with their meal.",
        options: [
          "milk",
          "water",
          "tea",
          "coffee"
        ],
        answer: 1,
        explanation: "The passage states 'We drink juice or water.'"
      }
    ]
  },
  {
    id: "a2_10",
    level: "A2",
    title: "A New Friend",
    topic: "School",
    passage: "Last month, a new student joined our class. Her name is Sofia. She moved from another city. At first, Sofia was very quiet and shy. I sat next to her and showed her around the school. We had lunch together every day. Soon she started smiling and talking more. Now Sofia is one of my best friends. I am glad I helped her.",
    questions: [
      {
        type: "mcq",
        q: "Where did Sofia come from?",
        options: [
          "Another country",
          "Another city",
          "Another school in the same city",
          "Another class"
        ],
        answer: 1,
        explanation: "The passage says 'She moved from another city.'"
      },
      {
        type: "gap_word",
        sentence: "At first, Sofia was very quiet and ___.",
        options: [
          "happy",
          "loud",
          "shy",
          "friendly"
        ],
        answer: 2,
        explanation: "The passage says 'At first, Sofia was very quiet and shy.'"
      },
      {
        type: "qa",
        q: "What did the writer do to help Sofia feel welcome at school?",
        keywords: [
          "sat",
          "lunch",
          "showed",
          "school"
        ],
        explanation: "The writer sat next to Sofia, showed her around the school, and had lunch with her every day."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Sofia and the writer had lunch together every day.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage clearly states 'We had lunch together every day.'"
      },
      {
        type: "mcq",
        q: "How does the writer feel at the end of the story?",
        options: [
          "Sad",
          "Tired",
          "Glad",
          "Worried"
        ],
        answer: 2,
        explanation: "The passage says 'I am glad I helped her.'"
      },
      {
        type: "gap_word",
        sentence: "Soon Sofia started smiling and ___ more.",
        options: [
          "eating",
          "studying",
          "talking",
          "running"
        ],
        answer: 2,
        explanation: "The passage says 'Soon she started smiling and talking more.'"
      }
    ]
  },
  {
    id: "b1_5",
    level: "B1",
    title: "Social Media and Teenagers",
    topic: "Technology",
    passage: "Social media platforms are used by millions of teenagers worldwide. Apps like Instagram, TikTok, and Snapchat allow young people to share photos, videos, and messages instantly. Many teenagers say social media helps them stay connected with friends and discover new interests. However, experts warn that excessive use can reduce focus and sleep quality. Comparing oneself to others online can also lower self-confidence. Parents and educators encourage young people to set time limits and take regular breaks from screens.",
    questions: [
      {
        type: "mcq",
        q: "Which of the following is a social media app mentioned in the passage?",
        options: [
          "YouTube",
          "TikTok",
          "Twitter",
          "WhatsApp"
        ],
        answer: 1,
        explanation: "The passage lists 'Instagram, TikTok, and Snapchat' as examples of social media apps used by teenagers."
      },
      {
        type: "gap_word",
        sentence: "Many teenagers say social media helps them stay ___ with friends.",
        options: [
          "busy",
          "popular",
          "connected",
          "satisfied"
        ],
        answer: 2,
        explanation: "The passage states that teenagers say social media helps them 'stay connected with friends'."
      },
      {
        type: "qa",
        q: "What are two negative effects of excessive social media use according to experts?",
        keywords: [
          "focus",
          "sleep",
          "self-confidence"
        ],
        explanation: "According to the passage, experts warn that excessive use can reduce focus and sleep quality, and comparing oneself to others online can lower self-confidence."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Teenagers use social media to share photos, videos, and messages instantly.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage states that apps 'allow young people to share photos, videos, and messages instantly'."
      },
      {
        type: "mcq",
        q: "What do parents and educators encourage young people to do about screen time?",
        options: [
          "Stop using social media completely",
          "Use only one app at a time",
          "Set time limits and take regular breaks",
          "Only use social media for school"
        ],
        answer: 2,
        explanation: "The passage says 'Parents and educators encourage young people to set time limits and take regular breaks from screens'."
      },
      {
        type: "gap_word",
        sentence: "Comparing oneself to others online can lower one's ___.",
        options: [
          "grades",
          "self-confidence",
          "screen time",
          "popularity"
        ],
        answer: 1,
        explanation: "The passage states that 'Comparing oneself to others online can also lower self-confidence'."
      },
      {
        type: "qa",
        q: "Besides staying connected with friends, what else do teenagers use social media for?",
        keywords: [
          "discover",
          "new",
          "interests"
        ],
        explanation: "The passage says teenagers use social media to 'discover new interests', in addition to staying connected with friends."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The government has introduced laws to limit teenagers' social media use.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage does not mention any government laws about social media use. It only refers to advice from parents and educators."
      }
    ]
  },
  {
    id: "b1_6",
    level: "B1",
    title: "Volunteering",
    topic: "Community",
    passage: "Volunteering means giving your time and skills to help others without being paid. Many people volunteer at hospitals, animal shelters, food banks, and community centres. Volunteers do tasks such as serving meals, caring for animals, teaching literacy classes, and supporting elderly people. Studies show that volunteering benefits not only the community but also the volunteers themselves. People who volunteer regularly report higher levels of happiness and a greater sense of purpose. Even a few hours a month can make a real difference.",
    questions: [
      {
        type: "mcq",
        q: "Where do many people volunteer, according to the passage?",
        options: [
          "Schools and libraries",
          "Hospitals and animal shelters",
          "Parks and museums",
          "Offices and factories"
        ],
        answer: 1,
        explanation: "The passage states that many people volunteer at hospitals, animal shelters, food banks, and community centres."
      },
      {
        type: "gap_word",
        sentence: "Volunteers do tasks such as serving meals, caring for animals, and teaching ___ classes.",
        options: [
          "cooking",
          "language",
          "literacy",
          "science"
        ],
        answer: 2,
        explanation: "The passage says volunteers teach 'literacy classes' as one of their tasks."
      },
      {
        type: "qa",
        q: "How does volunteering benefit the volunteers themselves?",
        keywords: [
          "happiness",
          "purpose",
          "regularly"
        ],
        explanation: "People who volunteer regularly report higher levels of happiness and a greater sense of purpose."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Volunteers receive a small amount of money for their work.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage clearly states that volunteering means giving time and skills 'without being paid.'"
      },
      {
        type: "mcq",
        q: "What does volunteering mean, according to the passage?",
        options: [
          "Working for a high salary",
          "Helping others without being paid",
          "Studying skills at a community centre",
          "Teaching animals new tasks"
        ],
        answer: 1,
        explanation: "The passage defines volunteering as 'giving your time and skills to help others without being paid.'"
      },
      {
        type: "gap_word",
        sentence: "Studies show that volunteering benefits not only the community but also the ___ themselves.",
        options: [
          "animals",
          "managers",
          "volunteers",
          "teachers"
        ],
        answer: 2,
        explanation: "The passage states that volunteering benefits 'not only the community but also the volunteers themselves.'"
      },
      {
        type: "qa",
        q: "How much time do people need to give to make a real difference, according to the passage?",
        keywords: [
          "few",
          "hours",
          "month"
        ],
        explanation: "The passage says that even a few hours a month can make a real difference."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Supporting elderly people is one of the tasks that volunteers do.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage lists 'supporting elderly people' as one of the tasks that volunteers do."
      }
    ]
  },
  {
    id: "b1_7",
    level: "B1",
    title: "Healthy Eating",
    topic: "Health",
    passage: "Eating a balanced diet is one of the most important things you can do for your health. A healthy diet includes plenty of fruits and vegetables, whole grains, protein from meat or plant sources, and limited amounts of sugar and saturated fat. Eating well provides energy, improves concentration, and reduces the risk of diseases like diabetes and heart disease. However, healthy eating does not need to be expensive. Cooking meals at home, buying seasonal vegetables, and reducing takeaways are practical steps anyone can take.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, which of the following is included in a healthy diet?",
        options: [
          "Large amounts of sugar",
          "Whole grains and vegetables",
          "Mostly saturated fat",
          "Only plant-based protein"
        ],
        answer: 1,
        explanation: "The passage states that a healthy diet includes 'plenty of fruits and vegetables, whole grains, protein from meat or plant sources, and limited amounts of sugar and saturated fat.'"
      },
      {
        type: "gap_word",
        sentence: "Eating well reduces the risk of diseases like diabetes and heart ___.",
        options: [
          "attack",
          "failure",
          "disease",
          "problem"
        ],
        answer: 2,
        explanation: "The passage states that eating well 'reduces the risk of diseases like diabetes and heart disease.'"
      },
      {
        type: "qa",
        q: "What are two benefits of eating a healthy diet mentioned in the passage?",
        keywords: [
          "energy",
          "concentration",
          "diseases"
        ],
        explanation: "The passage says eating well 'provides energy, improves concentration, and reduces the risk of diseases like diabetes and heart disease.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Healthy eating is always very expensive.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage clearly states that 'healthy eating does not need to be expensive,' so this statement is false."
      },
      {
        type: "mcq",
        q: "Which practical step does the passage suggest to eat more healthily without spending too much money?",
        options: [
          "Buying imported fruits",
          "Eating more takeaways",
          "Buying seasonal vegetables",
          "Going to restaurants"
        ],
        answer: 2,
        explanation: "The passage mentions 'buying seasonal vegetables' as one of the practical steps to eat healthily without high costs."
      },
      {
        type: "gap_word",
        sentence: "Cooking meals at ___ is one practical step anyone can take to eat more healthily.",
        options: [
          "school",
          "work",
          "home",
          "restaurants"
        ],
        answer: 2,
        explanation: "The passage states that 'cooking meals at home' is one of the practical steps anyone can take."
      },
      {
        type: "qa",
        q: "Where can protein come from, according to the passage?",
        keywords: [
          "meat",
          "plant",
          "sources"
        ],
        explanation: "The passage says protein can come from 'meat or plant sources,' meaning both animal and plant-based foods are acceptable."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Reducing takeaways can help people eat more healthily.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage lists 'reducing takeaways' as one of the practical steps anyone can take to eat more healthily."
      }
    ]
  },
  {
    id: "b1_8",
    level: "B1",
    title: "The History of Music",
    topic: "Culture",
    passage: "Music has existed in every human culture throughout history. The earliest instruments, such as flutes made from bone, date back over 40,000 years. In ancient civilisations, music was closely connected to religion, festivals, and storytelling. The invention of music notation in medieval Europe allowed compositions to be written down and shared. The industrial revolution led to mass production of instruments and eventually to recorded music in the twentieth century. Today, digital technology means anyone can record and share music globally within seconds.",
    questions: [
      {
        type: "mcq",
        q: "What were the earliest musical instruments made from?",
        options: [
          "Wood",
          "Stone",
          "Bone",
          "Metal"
        ],
        answer: 2,
        explanation: "The passage states that the earliest instruments, such as flutes, were made from bone."
      },
      {
        type: "gap_word",
        sentence: "Music notation was invented in medieval ___ and allowed compositions to be written down.",
        options: [
          "Asia",
          "Europe",
          "Africa",
          "America"
        ],
        answer: 1,
        explanation: "The passage says music notation was invented in medieval Europe."
      },
      {
        type: "qa",
        q: "What three things was music connected to in ancient civilisations?",
        keywords: [
          "religion",
          "festivals",
          "storytelling"
        ],
        explanation: "According to the passage, in ancient civilisations music was closely connected to religion, festivals, and storytelling."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The earliest bone flutes were found in Africa.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage mentions bone flutes but does not say where they were found."
      },
      {
        type: "mcq",
        q: "What was one effect of the industrial revolution on music?",
        options: [
          "Music notation was created",
          "Instruments were produced in large numbers",
          "Digital technology was invented",
          "Music became connected to religion"
        ],
        answer: 1,
        explanation: "The passage says the industrial revolution led to mass production of instruments."
      },
      {
        type: "gap_word",
        sentence: "Today, digital technology means anyone can record and share music ___ within seconds.",
        options: [
          "locally",
          "quietly",
          "globally",
          "slowly"
        ],
        answer: 2,
        explanation: "The passage states that digital technology means anyone can record and share music globally within seconds."
      },
      {
        type: "qa",
        q: "When did recorded music become available to people?",
        keywords: [
          "twentieth",
          "century",
          "recorded"
        ],
        explanation: "The passage says recorded music came in the twentieth century, following the industrial revolution."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Music has existed in most, but not all, human cultures throughout history.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage clearly states that music has existed in every human culture, not just most."
      }
    ]
  },
  {
    id: "b1_9",
    level: "B1",
    title: "City Living vs Rural Life",
    topic: "Society",
    passage: "People around the world live either in cities or in the countryside, and both lifestyles have advantages and disadvantages. City life offers better job opportunities, access to services, and entertainment. However, cities can be noisy, expensive, and stressful. Rural life provides fresh air, open space, and a sense of community, but can be isolated and have fewer job options. In recent years, remote working has allowed some people to enjoy the best of both worlds — working for city companies while living in quieter areas.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what is one advantage of living in a city?",
        options: [
          "Fresh air and open space",
          "A sense of community",
          "Better job opportunities",
          "Quieter environment"
        ],
        answer: 2,
        explanation: "The passage states that 'City life offers better job opportunities, access to services, and entertainment.'"
      },
      {
        type: "gap_word",
        sentence: "Rural life provides fresh air, open space, and a sense of ___, but can be isolated.",
        options: [
          "freedom",
          "entertainment",
          "community",
          "opportunity"
        ],
        answer: 2,
        explanation: "The passage says rural life provides 'a sense of community', according to the description of countryside living."
      },
      {
        type: "qa",
        q: "What are two disadvantages of living in a city mentioned in the passage?",
        keywords: [
          "noisy",
          "expensive",
          "stressful"
        ],
        explanation: "The passage states that 'cities can be noisy, expensive, and stressful', so any two of these are correct answers."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Living in the countryside always provides many job opportunities.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says rural life 'can be isolated and have fewer job options', meaning the countryside does NOT have many job opportunities."
      },
      {
        type: "mcq",
        q: "What has made it possible for some people to live in quieter areas while working for city companies?",
        options: [
          "Better public transport",
          "Remote working",
          "Lower city prices",
          "New entertainment options"
        ],
        answer: 1,
        explanation: "The passage states that 'remote working has allowed some people to enjoy the best of both worlds — working for city companies while living in quieter areas.'"
      },
      {
        type: "gap_word",
        sentence: "Cities can be noisy, ___, and stressful.",
        options: [
          "isolated",
          "expensive",
          "quiet",
          "boring"
        ],
        answer: 1,
        explanation: "The passage lists the disadvantages of city life as being 'noisy, expensive, and stressful.'"
      },
      {
        type: "qa",
        q: "How has remote working changed the way some people live, according to the passage?",
        keywords: [
          "remote working",
          "both worlds",
          "quieter"
        ],
        explanation: "The passage says remote working has allowed some people to enjoy the best of both worlds by working for city companies while living in quieter areas."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "More people currently live in the countryside than in cities.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage only says people live either in cities or the countryside, but does not compare the number of people in each place."
      }
    ]
  },
  {
    id: "b1_10",
    level: "B1",
    title: "Water on Earth",
    topic: "Science",
    passage: "Water covers about 71 percent of the Earth's surface, yet only about 3 percent of all water is fresh and suitable for drinking. Most of this fresh water is frozen in glaciers and polar ice caps. Less than one percent is easily accessible in rivers, lakes, and groundwater. Access to clean water is a serious global challenge. In many developing countries, people must walk kilometres to collect water, which is often contaminated. Climate change is making water shortages worse by altering rainfall patterns and melting glaciers faster than before.",
    questions: [
      {
        type: "mcq",
        q: "What percentage of the Earth's surface is covered by water?",
        options: [
          "About 3 percent",
          "About 50 percent",
          "About 71 percent",
          "About 90 percent"
        ],
        answer: 2,
        explanation: "The passage states that water covers about 71 percent of the Earth's surface."
      },
      {
        type: "gap_word",
        sentence: "Most fresh water is frozen in glaciers and polar ice ___.",
        options: [
          "rivers",
          "caps",
          "lakes",
          "fields"
        ],
        answer: 1,
        explanation: "The passage says 'Most of this fresh water is frozen in glaciers and polar ice caps.'"
      },
      {
        type: "qa",
        q: "Where can easily accessible fresh water be found, according to the passage?",
        keywords: [
          "rivers",
          "lakes",
          "groundwater"
        ],
        explanation: "The passage states that less than one percent of fresh water is easily accessible in rivers, lakes, and groundwater."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "In many developing countries, people have to travel long distances to get water.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage says 'people must walk kilometres to collect water,' which means they travel long distances."
      },
      {
        type: "mcq",
        q: "What problem does the water that people collect in developing countries often have?",
        options: [
          "It is too cold to drink",
          "It is contaminated",
          "It is too salty",
          "It is very expensive"
        ],
        answer: 1,
        explanation: "The passage states that the water collected in developing countries 'is often contaminated.'"
      },
      {
        type: "gap_word",
        sentence: "Climate change is altering rainfall ___ and making water shortages worse.",
        options: [
          "patterns",
          "amounts",
          "seasons",
          "colours"
        ],
        answer: 0,
        explanation: "The passage says climate change is 'altering rainfall patterns,' which makes water shortages worse."
      },
      {
        type: "qa",
        q: "How is climate change making the problem of water shortages worse?",
        keywords: [
          "rainfall",
          "patterns",
          "glaciers",
          "melting"
        ],
        explanation: "According to the passage, climate change is making shortages worse by altering rainfall patterns and melting glaciers faster than before."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Governments around the world have already solved the problem of access to clean water.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage describes access to clean water as 'a serious global challenge' but does not mention any governments solving the problem."
      }
    ]
  },
  {
    id: "b2_5",
    level: "B2",
    title: "The Gig Economy",
    topic: "Economics",
    passage: "The gig economy refers to a labour market characterised by short-term contracts and freelance work rather than permanent employment. Platforms such as Uber, Deliveroo, and Upwork have made it easy for workers to find temporary tasks. Proponents argue that gig work offers flexibility and autonomy, allowing people to set their own hours and take on multiple clients. Critics, however, point out that gig workers typically lack job security, employee benefits such as sick pay and pensions, and stable income. The debate raises fundamental questions about how labour rights should adapt to modern digital economies.",
    questions: [
      {
        type: "mcq",
        q: "What does the gig economy primarily involve?",
        options: [
          "Permanent employment contracts",
          "Short-term contracts and freelance work",
          "Government-funded job schemes",
          "Traditional factory-based labour"
        ],
        answer: 1,
        explanation: "The passage states the gig economy is 'characterised by short-term contracts and freelance work rather than permanent employment.'"
      },
      {
        type: "gap_word",
        sentence: "Platforms such as Uber, Deliveroo, and Upwork have made it easy for workers to find ___ tasks.",
        options: [
          "permanent",
          "skilled",
          "temporary",
          "creative"
        ],
        answer: 2,
        explanation: "The passage uses the word 'temporary' to describe the tasks found through these platforms."
      },
      {
        type: "qa",
        q: "What advantages do supporters of gig work say it offers to workers?",
        keywords: [
          "flexibility",
          "autonomy",
          "hours",
          "clients"
        ],
        explanation: "Proponents argue that gig work offers flexibility and autonomy, allowing workers to set their own hours and take on multiple clients."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Gig workers usually receive sick pay and pension benefits from the platforms they work for.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that gig workers 'typically lack employee benefits such as sick pay and pensions.'"
      },
      {
        type: "mcq",
        q: "Which of the following is listed in the passage as a platform associated with the gig economy?",
        options: [
          "Amazon",
          "LinkedIn",
          "Upwork",
          "Spotify"
        ],
        answer: 2,
        explanation: "The passage specifically names 'Upwork' alongside Uber and Deliveroo as examples of gig economy platforms."
      },
      {
        type: "gap_word",
        sentence: "Critics point out that gig workers typically lack job security and ___ income.",
        options: [
          "growing",
          "stable",
          "flexible",
          "high"
        ],
        answer: 1,
        explanation: "The passage says critics highlight the absence of 'stable income' as a disadvantage for gig workers."
      },
      {
        type: "qa",
        q: "What broader issue does the debate about the gig economy raise, according to the passage?",
        keywords: [
          "labour rights",
          "adapt",
          "digital",
          "economies"
        ],
        explanation: "The passage says the debate raises fundamental questions about how labour rights should adapt to modern digital economies."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The passage discusses specific laws that have already been passed to protect gig workers.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage only mentions that the debate raises questions about adapting labour rights; no specific laws are discussed."
      },
      {
        type: "mcq",
        q: "According to the passage, what is one criticism of gig work?",
        options: [
          "It requires too many qualifications",
          "Workers cannot choose their own hours",
          "Workers lack stable income",
          "Platforms are difficult to access"
        ],
        answer: 2,
        explanation: "The passage states critics point out that gig workers lack 'stable income' among other disadvantages."
      },
      {
        type: "gap_word",
        sentence: "The gig economy debate raises fundamental questions about how ___ rights should adapt to modern digital economies.",
        options: [
          "human",
          "labour",
          "civil",
          "consumer"
        ],
        answer: 1,
        explanation: "The passage explicitly uses the phrase 'labour rights' when describing the broader questions raised by the debate."
      }
    ]
  },
  {
    id: "b2_6",
    level: "B2",
    title: "Architecture and Society",
    topic: "Culture",
    passage: "Architecture is far more than the design of buildings — it shapes how people feel, interact, and live. Throughout history, architectural style has reflected the values and ambitions of each era. Ancient Egyptian pyramids symbolised power and the afterlife. Gothic cathedrals embodied spiritual aspiration. Modernist glass towers celebrate efficiency and rationalism. Contemporary architects increasingly focus on sustainability, designing buildings that consume less energy, incorporate green spaces, and use recycled materials. Urban planners argue that thoughtful design can reduce crime, increase happiness, and foster a sense of community.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what did Ancient Egyptian pyramids represent?",
        options: [
          "Efficiency and rationalism",
          "Spiritual aspiration",
          "Power and the afterlife",
          "Sustainability and community"
        ],
        answer: 2,
        explanation: "The passage states that 'Ancient Egyptian pyramids symbolised power and the afterlife.'"
      },
      {
        type: "gap_word",
        sentence: "Contemporary architects increasingly focus on ___, designing buildings that consume less energy.",
        options: [
          "rationalism",
          "sustainability",
          "spirituality",
          "efficiency"
        ],
        answer: 1,
        explanation: "The passage says 'Contemporary architects increasingly focus on sustainability, designing buildings that consume less energy.'"
      },
      {
        type: "qa",
        q: "What broader effects does the passage say thoughtful urban design can have on society?",
        keywords: [
          "crime",
          "happiness",
          "community"
        ],
        explanation: "According to the passage, thoughtful design can reduce crime, increase happiness, and foster a sense of community."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Gothic cathedrals were built primarily to demonstrate the political power of medieval rulers.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that Gothic cathedrals 'embodied spiritual aspiration,' not political power."
      },
      {
        type: "mcq",
        q: "Which of the following best describes the main idea of the passage?",
        options: [
          "Architecture is mainly about making buildings look attractive.",
          "Architecture reflects values, influences society, and is evolving towards sustainability.",
          "Modern architects are more skilled than ancient ones.",
          "Urban planning is more important than architectural design."
        ],
        answer: 1,
        explanation: "The passage covers architecture's historical reflection of values, its social impact, and the contemporary focus on sustainability."
      },
      {
        type: "gap_word",
        sentence: "Modernist glass towers celebrate efficiency and ___.",
        options: [
          "community",
          "aspiration",
          "rationalism",
          "recycling"
        ],
        answer: 2,
        explanation: "The passage states that 'Modernist glass towers celebrate efficiency and rationalism.'"
      },
      {
        type: "qa",
        q: "What materials or features do contemporary architects use to make buildings more sustainable?",
        keywords: [
          "recycled materials",
          "green spaces",
          "energy"
        ],
        explanation: "The passage mentions that contemporary architects design buildings that consume less energy, incorporate green spaces, and use recycled materials."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Architecture has an influence on how people feel and interact with each other.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage opens by stating that architecture 'shapes how people feel, interact, and live.'"
      },
      {
        type: "mcq",
        q: "According to the passage, what do urban planners believe about thoughtful design?",
        options: [
          "It can make buildings more profitable.",
          "It can reduce crime and increase happiness.",
          "It is only relevant in large cities.",
          "It requires the use of recycled materials."
        ],
        answer: 1,
        explanation: "The passage states that 'Urban planners argue that thoughtful design can reduce crime, increase happiness, and foster a sense of community.'"
      },
      {
        type: "gap_word",
        sentence: "Throughout history, architectural style has reflected the values and ___ of each era.",
        options: [
          "materials",
          "ambitions",
          "problems",
          "leaders"
        ],
        answer: 1,
        explanation: "The passage says 'architectural style has reflected the values and ambitions of each era.'"
      }
    ]
  },
  {
    id: "b2_7",
    level: "B2",
    title: "Memory and Learning",
    topic: "Psychology",
    passage: "Memory is not a single system but a collection of distinct processes. Working memory holds information temporarily for immediate use, while long-term memory stores knowledge for extended periods. Research shows that the most effective learning strategies involve active retrieval — testing yourself rather than simply re-reading. The spacing effect demonstrates that spreading study sessions over time produces better retention than cramming. Emotional experiences are often remembered more vividly because the amygdala enhances encoding when arousal is high. Understanding these mechanisms helps students adopt evidence-based study techniques.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what does working memory do?",
        options: [
          "Holds information temporarily for immediate use",
          "Stores knowledge for extended periods",
          "Enhances emotional experiences",
          "Spreads study sessions over time"
        ],
        answer: 0,
        explanation: "The passage states that 'working memory holds information temporarily for immediate use.'"
      },
      {
        type: "gap_word",
        sentence: "The most effective learning strategies involve active ___, such as testing yourself rather than re-reading.",
        options: [
          "spacing",
          "cramming",
          "retrieval",
          "encoding"
        ],
        answer: 2,
        explanation: "The passage says 'the most effective learning strategies involve active retrieval — testing yourself rather than simply re-reading.'"
      },
      {
        type: "qa",
        q: "What is the spacing effect, and what benefit does it provide according to the passage?",
        keywords: [
          "spacing",
          "study sessions",
          "retention"
        ],
        explanation: "The spacing effect means spreading study sessions over time, which produces better retention than cramming, as stated in the passage."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Memory is a single, unified system.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly states that 'memory is not a single system but a collection of distinct processes.'"
      },
      {
        type: "mcq",
        q: "Why are emotional experiences often remembered more vividly, according to the passage?",
        options: [
          "Because long-term memory stores them separately",
          "Because the amygdala enhances encoding when arousal is high",
          "Because working memory gives them extra space",
          "Because the spacing effect applies to emotions"
        ],
        answer: 1,
        explanation: "The passage states that 'the amygdala enhances encoding when arousal is high,' making emotional experiences more vivid."
      },
      {
        type: "gap_word",
        sentence: "Long-term memory stores knowledge for ___ periods.",
        options: [
          "temporary",
          "immediate",
          "short",
          "extended"
        ],
        answer: 3,
        explanation: "The passage says 'long-term memory stores knowledge for extended periods.'"
      },
      {
        type: "qa",
        q: "How can understanding memory mechanisms benefit students, according to the passage?",
        keywords: [
          "evidence-based",
          "study techniques",
          "adopt"
        ],
        explanation: "According to the passage, understanding these mechanisms helps students adopt evidence-based study techniques."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Cramming produces better retention than spreading study sessions over time.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states the opposite: 'spreading study sessions over time produces better retention than cramming.'"
      },
      {
        type: "mcq",
        q: "Which brain structure is mentioned in the passage as playing a role in memory encoding?",
        options: [
          "The hippocampus",
          "The cerebral cortex",
          "The amygdala",
          "The prefrontal cortex"
        ],
        answer: 2,
        explanation: "The passage specifically mentions 'the amygdala enhances encoding when arousal is high.'"
      },
      {
        type: "gap_word",
        sentence: "Spreading study sessions over time is more effective than ___ for long-term retention.",
        options: [
          "retrieval",
          "spacing",
          "cramming",
          "encoding"
        ],
        answer: 2,
        explanation: "The passage states that 'spreading study sessions over time produces better retention than cramming.'"
      }
    ]
  },
  {
    id: "b2_8",
    level: "B2",
    title: "Globalisation and Culture",
    topic: "Society",
    passage: "Globalisation has accelerated the flow of goods, ideas, and people across borders. While it has brought economic growth and raised living standards in many regions, it has also sparked debates about cultural homogenisation. Critics argue that dominant global cultures — particularly American popular culture — are eroding local traditions, languages, and identities. However, many scholars counter that cultures are not passive recipients. Local communities adapt imported ideas, creating hybrid forms that blend global and traditional elements. This process, known as glocalisation, suggests that cultural identity can be both resilient and dynamic.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what have critics argued about dominant global cultures?",
        options: [
          "They promote local traditions around the world",
          "They are eroding local traditions, languages, and identities",
          "They encourage cultural exchange between equal partners",
          "They have no significant effect on local communities"
        ],
        answer: 1,
        explanation: "The passage states that critics argue dominant global cultures, particularly American popular culture, are eroding local traditions, languages, and identities."
      },
      {
        type: "gap_word",
        sentence: "Globalisation has accelerated the flow of goods, ideas, and ___ across borders.",
        options: [
          "money",
          "technology",
          "people",
          "governments"
        ],
        answer: 2,
        explanation: "The passage explicitly states that globalisation has accelerated the flow of goods, ideas, and people across borders."
      },
      {
        type: "qa",
        q: "What do many scholars say about how local communities respond to imported cultural ideas?",
        keywords: [
          "adapt",
          "hybrid",
          "glocalisation"
        ],
        explanation: "Many scholars argue that local communities are not passive recipients; instead, they adapt imported ideas and create hybrid forms that blend global and traditional elements, a process known as glocalisation."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Globalisation has had a negative economic impact on most regions of the world.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that globalisation has brought economic growth and raised living standards in many regions, contradicting the idea of a negative economic impact."
      },
      {
        type: "mcq",
        q: "What does the term 'glocalisation' refer to in the passage?",
        options: [
          "The spread of American culture worldwide",
          "The rejection of all foreign cultural influences",
          "The process of blending global and traditional cultural elements",
          "The economic growth caused by international trade"
        ],
        answer: 2,
        explanation: "The passage defines glocalisation as the process by which local communities adapt imported ideas, creating hybrid forms that blend global and traditional elements."
      },
      {
        type: "gap_word",
        sentence: "Many scholars counter that cultures are not ___ recipients of global influences.",
        options: [
          "active",
          "passive",
          "willing",
          "reluctant"
        ],
        answer: 1,
        explanation: "The passage states that many scholars counter that cultures are not passive recipients, meaning they actively adapt incoming influences."
      },
      {
        type: "qa",
        q: "What two qualities does the passage suggest cultural identity can have, according to the concept of glocalisation?",
        keywords: [
          "resilient",
          "dynamic",
          "identity"
        ],
        explanation: "According to the passage, glocalisation suggests that cultural identity can be both resilient and dynamic, meaning it can withstand outside pressures while also evolving and changing."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "American popular culture is the only form of global culture mentioned as a concern by critics.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage states that critics are particularly concerned about American popular culture as an example of dominant global cultures eroding local traditions, making it the only one specifically mentioned."
      },
      {
        type: "mcq",
        q: "Which of the following best describes the overall structure of the argument in the passage?",
        options: [
          "A one-sided argument in favour of globalisation",
          "A problem followed by a solution from economists",
          "A criticism of globalisation followed by a scholarly counterargument",
          "A historical account of how globalisation began"
        ],
        answer: 2,
        explanation: "The passage presents critics' concerns about cultural erosion and then offers scholars' counterargument that communities adapt through glocalisation, forming a two-sided discussion."
      },
      {
        type: "gap_word",
        sentence: "Glocalisation creates ___ forms that blend global and traditional elements.",
        options: [
          "ancient",
          "identical",
          "hybrid",
          "foreign"
        ],
        answer: 2,
        explanation: "The passage describes the products of glocalisation as hybrid forms that blend global and traditional elements."
      }
    ]
  },
  {
    id: "b2_9",
    level: "B2",
    title: "Artificial Intelligence in Everyday Life",
    topic: "Technology",
    passage: "Artificial intelligence is no longer confined to research laboratories — it is embedded in the tools billions of people use daily. Recommendation algorithms curate the music, videos, and news we consume. Natural language processing powers virtual assistants and translation apps. Machine learning models detect fraud in banking and diagnose diseases in radiology. While these applications deliver genuine convenience, they raise important concerns. Opaque algorithms can encode and amplify societal biases. Over-reliance on AI decision-making may erode human accountability. The challenge for society is to harness AI's benefits while establishing robust governance frameworks.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what do recommendation algorithms do?",
        options: [
          "They curate the music, videos, and news people consume.",
          "They detect fraud in banking systems.",
          "They power virtual assistants and translation apps.",
          "They diagnose diseases in radiology."
        ],
        answer: 0,
        explanation: "The passage states: 'Recommendation algorithms curate the music, videos, and news we consume.'"
      },
      {
        type: "gap_word",
        sentence: "Machine learning models detect fraud in banking and diagnose diseases in ___.",
        options: [
          "laboratories",
          "hospitals",
          "radiology",
          "surgery"
        ],
        answer: 2,
        explanation: "The passage states that machine learning models 'diagnose diseases in radiology.'"
      },
      {
        type: "qa",
        q: "What technology is mentioned in the passage as powering virtual assistants and translation apps?",
        keywords: [
          "natural",
          "language",
          "processing"
        ],
        explanation: "The passage states that 'Natural language processing powers virtual assistants and translation apps.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Artificial intelligence is still mainly used only in research laboratories.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage clearly states that AI 'is no longer confined to research laboratories' and is used by billions of people daily."
      },
      {
        type: "mcq",
        q: "Which of the following concerns about AI is mentioned in the passage?",
        options: [
          "AI systems consume too much energy.",
          "Opaque algorithms can encode and amplify societal biases.",
          "AI makes technology too expensive for ordinary people.",
          "Virtual assistants record private conversations."
        ],
        answer: 1,
        explanation: "The passage states: 'Opaque algorithms can encode and amplify societal biases.'"
      },
      {
        type: "gap_word",
        sentence: "Over-reliance on AI decision-making may erode human ___.",
        options: [
          "creativity",
          "intelligence",
          "accountability",
          "employment"
        ],
        answer: 2,
        explanation: "The passage states: 'Over-reliance on AI decision-making may erode human accountability.'"
      },
      {
        type: "qa",
        q: "What does the passage say society must do to address the challenges posed by artificial intelligence?",
        keywords: [
          "harness",
          "benefits",
          "governance"
        ],
        explanation: "The passage states: 'The challenge for society is to harness AI's benefits while establishing robust governance frameworks.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The passage suggests that AI applications provide no real benefits to users.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage acknowledges that AI applications 'deliver genuine convenience,' indicating real benefits exist."
      },
      {
        type: "mcq",
        q: "How does the passage describe the current reach of artificial intelligence?",
        options: [
          "It is limited to a small number of scientific institutions.",
          "It is embedded in tools used by billions of people daily.",
          "It is only accessible to businesses and governments.",
          "It is mostly used in the entertainment industry."
        ],
        answer: 1,
        explanation: "The passage opens by stating AI 'is embedded in the tools billions of people use daily.'"
      },
      {
        type: "gap_word",
        sentence: "The challenge for society is to harness AI's benefits while establishing robust ___ frameworks.",
        options: [
          "legal",
          "governance",
          "scientific",
          "financial"
        ],
        answer: 1,
        explanation: "The passage concludes by calling for 'robust governance frameworks' to manage AI's impact."
      }
    ]
  },
  {
    id: "b2_10",
    level: "B2",
    title: "Ocean Ecosystems",
    topic: "Science",
    passage: "The world's oceans cover over 70 percent of Earth's surface and contain the most diverse ecosystems on the planet. Coral reefs, often called the rainforests of the sea, support approximately 25 percent of all marine species despite covering less than one percent of the ocean floor. Deep-sea ecosystems remain largely unexplored; creatures at extreme depths survive without sunlight through chemosynthesis. The oceans play a crucial role in regulating the global climate by absorbing carbon dioxide and distributing heat. However, rising sea temperatures, ocean acidification, and plastic pollution are threatening marine biodiversity at an unprecedented rate.",
    questions: [
      {
        type: "mcq",
        q: "What percentage of Earth's surface do the world's oceans cover?",
        options: [
          "More than 80 percent",
          "Less than 60 percent",
          "Over 70 percent",
          "Exactly 75 percent"
        ],
        answer: 2,
        explanation: "The passage states that 'the world's oceans cover over 70 percent of Earth's surface.'"
      },
      {
        type: "gap_word",
        sentence: "Coral reefs support approximately 25 percent of all marine species despite covering less than one percent of the ocean ___.",
        options: [
          "surface",
          "water",
          "floor",
          "area"
        ],
        answer: 2,
        explanation: "The passage says coral reefs cover 'less than one percent of the ocean floor.'"
      },
      {
        type: "qa",
        q: "How do creatures in deep-sea ecosystems survive without sunlight?",
        keywords: [
          "chemosynthesis",
          "extreme depths",
          "survive"
        ],
        explanation: "According to the passage, creatures at extreme depths survive without sunlight through chemosynthesis."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Scientists have fully explored and documented deep-sea ecosystems.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that 'deep-sea ecosystems remain largely unexplored,' meaning they have not been fully explored."
      },
      {
        type: "mcq",
        q: "Which of the following best describes the role of oceans in regulating global climate?",
        options: [
          "They produce oxygen and block solar radiation",
          "They absorb carbon dioxide and distribute heat",
          "They reduce wind speeds and generate rainfall",
          "They store nutrients and release nitrogen"
        ],
        answer: 1,
        explanation: "The passage states that oceans 'play a crucial role in regulating the global climate by absorbing carbon dioxide and distributing heat.'"
      },
      {
        type: "gap_word",
        sentence: "Coral reefs are often called the ___ of the sea because of the biodiversity they support.",
        options: [
          "deserts",
          "rainforests",
          "mountains",
          "valleys"
        ],
        answer: 1,
        explanation: "The passage refers to coral reefs as 'the rainforests of the sea.'"
      },
      {
        type: "qa",
        q: "What three threats to marine biodiversity does the passage mention?",
        keywords: [
          "rising sea temperatures",
          "ocean acidification",
          "plastic pollution"
        ],
        explanation: "The passage lists rising sea temperatures, ocean acidification, and plastic pollution as the three threats to marine biodiversity."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Ocean acidification is caused mainly by the dumping of industrial waste.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage mentions ocean acidification as a threat but does not explain its cause, so this cannot be determined from the text."
      },
      {
        type: "mcq",
        q: "According to the passage, what makes coral reefs particularly remarkable compared to their size?",
        options: [
          "They are found at extreme ocean depths",
          "They produce most of the ocean's oxygen",
          "They support about 25 percent of all marine species",
          "They cover more than half of the ocean floor"
        ],
        answer: 2,
        explanation: "The passage notes that coral reefs 'support approximately 25 percent of all marine species despite covering less than one percent of the ocean floor.'"
      },
      {
        type: "gap_word",
        sentence: "Marine biodiversity is being threatened at an ___ rate due to human and environmental pressures.",
        options: [
          "ordinary",
          "increasing",
          "unprecedented",
          "acceptable"
        ],
        answer: 2,
        explanation: "The passage states that marine biodiversity is being threatened 'at an unprecedented rate.'"
      }
    ]
  },
  {
    id: "c1_5",
    level: "C1",
    title: "The Ethics of Artificial Intelligence",
    topic: "Ethics",
    passage: "As artificial intelligence systems become increasingly capable of autonomous decision-making, profound ethical questions emerge. One central concern is moral responsibility: when an AI causes harm — such as a self-driving vehicle fatally striking a pedestrian — who bears accountability? The developer, the manufacturer, or the operator? Philosophers have proposed various frameworks, from strict liability models to distributed responsibility schemes. A second concern involves algorithmic fairness: training data reflecting historical inequalities can produce models that systematically disadvantage marginalised groups. Addressing these challenges requires not only technical solutions but also governance structures that embed ethical principles into the design, deployment, and auditing of AI systems.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, which of the following is cited as a specific example of harm caused by an AI system?",
        options: [
          "A self-driving vehicle fatally striking a pedestrian",
          "An algorithm denying loans to marginalised groups",
          "A manufacturer releasing a defective AI product",
          "An AI system making biased hiring decisions"
        ],
        answer: 0,
        explanation: "The passage explicitly states 'a self-driving vehicle fatally striking a pedestrian' as an example of harm caused by AI."
      },
      {
        type: "gap_word",
        sentence: "Training data reflecting historical inequalities can produce models that systematically ___ marginalised groups.",
        options: [
          "support",
          "identify",
          "disadvantage",
          "classify"
        ],
        answer: 2,
        explanation: "The passage states that biased training data can produce models that 'systematically disadvantage marginalised groups'."
      },
      {
        type: "qa",
        q: "What three parties does the passage suggest might bear accountability when an AI system causes harm?",
        keywords: [
          "developer",
          "manufacturer",
          "operator"
        ],
        explanation: "The passage lists the developer, the manufacturer, and the operator as the potential parties accountable when an AI causes harm."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Philosophers have reached a consensus on a single framework for assigning moral responsibility in AI-related harm.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that philosophers have 'proposed various frameworks', indicating no single agreed-upon model, not a consensus."
      },
      {
        type: "mcq",
        q: "Which of the following best describes what the passage identifies as the root cause of algorithmic unfairness?",
        options: [
          "Deliberate bias introduced by AI developers",
          "Training data that reflects historical inequalities",
          "A lack of regulatory oversight of AI systems",
          "The autonomous decision-making capacity of AI"
        ],
        answer: 1,
        explanation: "The passage states that 'training data reflecting historical inequalities can produce models that systematically disadvantage marginalised groups'."
      },
      {
        type: "gap_word",
        sentence: "Philosophers have proposed frameworks ranging from strict liability models to ___ responsibility schemes.",
        options: [
          "individual",
          "distributed",
          "legal",
          "shared"
        ],
        answer: 1,
        explanation: "The passage specifically uses the term 'distributed responsibility schemes' as one of the proposed philosophical frameworks."
      },
      {
        type: "qa",
        q: "According to the passage, what two broad types of solutions are needed to address the ethical challenges posed by AI?",
        keywords: [
          "technical",
          "governance",
          "ethical principles"
        ],
        explanation: "The passage states that addressing these challenges requires 'not only technical solutions but also governance structures that embed ethical principles'."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Governance structures should incorporate ethical principles into the design, deployment, and auditing of AI systems.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly states that governance structures must 'embed ethical principles into the design, deployment, and auditing of AI systems'."
      },
      {
        type: "mcq",
        q: "How does the passage characterise the ethical questions that arise from increasingly capable AI systems?",
        options: [
          "Trivial and easily resolved through existing law",
          "Primarily technical rather than philosophical",
          "Profound and central to AI development",
          "Limited in scope to commercial applications"
        ],
        answer: 2,
        explanation: "The passage opens by describing the ethical questions as 'profound', and identifies moral responsibility as 'one central concern'."
      },
      {
        type: "gap_word",
        sentence: "As AI systems become increasingly capable of autonomous ___-making, profound ethical questions emerge.",
        options: [
          "policy",
          "risk",
          "decision",
          "profit"
        ],
        answer: 2,
        explanation: "The passage opens with 'autonomous decision-making' as the capability driving the emergence of ethical questions."
      },
      {
        type: "qa",
        q: "Why, according to the passage, does algorithmic bias present a significant ethical concern?",
        keywords: [
          "training data",
          "inequalities",
          "marginalised",
          "systematically"
        ],
        explanation: "The passage explains that because training data can reflect historical inequalities, AI models may systematically disadvantage marginalised groups, making bias a serious ethical issue."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The passage suggests that technical solutions alone are sufficient to resolve the ethical challenges associated with AI.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly states that addressing these challenges requires 'not only technical solutions but also governance structures', implying technical fixes alone are insufficient."
      }
    ]
  },
  {
    id: "c1_6",
    level: "C1",
    title: "Narrative and Identity",
    topic: "Literature",
    passage: "Contemporary literary theorists argue that human identity is fundamentally narrative in structure. We understand ourselves by constructing stories — selecting events, imposing causality, and projecting forward to an anticipated future. Paul Ricoeur's concept of 'narrative identity' holds that the self is neither a fixed substance nor a mere illusion, but an ongoing interpretive achievement mediated through storytelling. This perspective has significant implications for psychology and therapy: autobiographical narratives can be revised, enabling people to reconstitute their identities following trauma. However, critics caution that narrative coherence can be deceptive — imposing false unity on inherently fragmented experience.",
    questions: [
      {
        type: "mcq",
        q: "According to contemporary literary theorists, how is human identity best characterised?",
        options: [
          "As a fixed and unchanging substance",
          "As fundamentally narrative in structure",
          "As a biological phenomenon",
          "As an illusion created by memory"
        ],
        answer: 1,
        explanation: "The passage states that 'human identity is fundamentally narrative in structure,' which directly supports option B."
      },
      {
        type: "gap_word",
        sentence: "Ricoeur's narrative identity holds that the self is an ongoing interpretive ___ mediated through storytelling.",
        options: [
          "illusion",
          "substance",
          "achievement",
          "construction"
        ],
        answer: 2,
        explanation: "The passage uses the phrase 'ongoing interpretive achievement mediated through storytelling' to describe Ricoeur's concept of the self."
      },
      {
        type: "qa",
        q: "What processes does the passage identify as involved in the construction of self-narratives?",
        keywords: [
          "selecting",
          "causality",
          "projecting",
          "events",
          "future"
        ],
        explanation: "The passage states that constructing stories involves 'selecting events, imposing causality, and projecting forward to an anticipated future,' indicating these are the key processes."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Paul Ricoeur believed the self is a fixed substance that remains stable throughout a person's life.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly states that Ricoeur holds the self is 'neither a fixed substance nor a mere illusion,' making this statement false."
      },
      {
        type: "mcq",
        q: "What therapeutic implication does the passage suggest follows from the narrative identity perspective?",
        options: [
          "Trauma can be eliminated through medication",
          "Therapists should write patients' life stories for them",
          "Autobiographical narratives can be revised to reconstitute identity after trauma",
          "People should avoid constructing personal narratives"
        ],
        answer: 2,
        explanation: "The passage states that 'autobiographical narratives can be revised, enabling people to reconstitute their identities following trauma.'"
      },
      {
        type: "gap_word",
        sentence: "Critics warn that narrative coherence risks imposing false unity on inherently ___ experience.",
        options: [
          "coherent",
          "meaningful",
          "fragmented",
          "narrative"
        ],
        answer: 2,
        explanation: "The passage states that critics caution against 'imposing false unity on inherently fragmented experience,' making 'fragmented' the correct answer."
      },
      {
        type: "qa",
        q: "Why do critics regard narrative coherence as potentially problematic, according to the passage?",
        keywords: [
          "deceptive",
          "false unity",
          "fragmented",
          "experience"
        ],
        explanation: "Critics caution that narrative coherence 'can be deceptive — imposing false unity on inherently fragmented experience,' suggesting it misrepresents the true nature of lived experience."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The narrative identity perspective has implications for both psychology and therapy.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly states that 'this perspective has significant implications for psychology and therapy.'"
      },
      {
        type: "mcq",
        q: "How does Paul Ricoeur's concept position the self in relation to illusion?",
        options: [
          "The self is entirely illusory",
          "The self is partly illusory and partly fixed",
          "The self is neither a fixed substance nor a mere illusion",
          "The self is an illusion maintained by cultural narratives"
        ],
        answer: 2,
        explanation: "The passage states Ricoeur holds the self is 'neither a fixed substance nor a mere illusion,' directly supporting option C."
      },
      {
        type: "gap_word",
        sentence: "Contemporary literary theorists argue that we understand ourselves by ___ stories.",
        options: [
          "reading",
          "analysing",
          "constructing",
          "dismissing"
        ],
        answer: 2,
        explanation: "The passage states 'We understand ourselves by constructing stories,' making 'constructing' the correct word to complete the sentence."
      },
      {
        type: "qa",
        q: "In what way does the passage suggest that narrative identity is an active rather than passive process?",
        keywords: [
          "interpretive",
          "achievement",
          "ongoing",
          "constructing",
          "selecting"
        ],
        explanation: "The passage describes the self as 'an ongoing interpretive achievement' and highlights active processes such as 'selecting events, imposing causality, and projecting forward,' all of which imply active engagement rather than passive reception."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Ricoeur developed his concept of narrative identity in direct response to trauma therapy practices.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage introduces Ricoeur's concept and separately mentions therapeutic implications, but does not state that his theory was developed in response to trauma therapy practices."
      }
    ]
  },
  {
    id: "c1_7",
    level: "C1",
    title: "Behavioural Economics",
    topic: "Economics",
    passage: "Classical economics assumed that human beings are rational actors who consistently maximise utility. Behavioural economics, drawing on insights from psychology, challenges this premise. Research by Kahneman and Tversky demonstrated systematic irrationalities: loss aversion (losses feel roughly twice as painful as equivalent gains), the framing effect (decisions change depending on how options are presented), and the sunk cost fallacy (continuing to invest in a failing project because of past expenditure). These findings have practical applications in public policy — 'nudge' theory uses default options and choice architecture to guide people towards beneficial behaviours without coercion.",
    questions: [
      {
        type: "mcq",
        q: "What fundamental assumption of classical economics does behavioural economics challenge?",
        options: [
          "That human beings consistently maximise utility as rational actors",
          "That psychology has no relevance to economic decision-making",
          "That loss aversion is a universal human trait",
          "That public policy should avoid influencing individual choices"
        ],
        answer: 0,
        explanation: "The passage states that classical economics assumed humans are 'rational actors who consistently maximise utility' and that behavioural economics 'challenges this premise'."
      },
      {
        type: "gap_word",
        sentence: "The research by Kahneman and Tversky demonstrated ___ irrationalities in human decision-making.",
        options: [
          "occasional",
          "random",
          "systematic",
          "theoretical"
        ],
        answer: 2,
        explanation: "The passage uses the word 'systematic' to describe the irrationalities demonstrated by Kahneman and Tversky, indicating they are consistent and predictable patterns."
      },
      {
        type: "qa",
        q: "What does loss aversion mean according to the passage, and how does it distort rational decision-making?",
        keywords: [
          "losses",
          "twice",
          "painful",
          "gains",
          "equivalent"
        ],
        explanation: "According to the passage, loss aversion means that losses feel roughly twice as painful as equivalent gains, meaning people disproportionately weight negative outcomes over positive ones of the same magnitude, leading to irrational decisions."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Kahneman and Tversky conducted their research independently of each other.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage mentions Kahneman and Tversky together as researchers but provides no information about whether their work was collaborative or independent."
      },
      {
        type: "mcq",
        q: "According to the passage, what is the sunk cost fallacy?",
        options: [
          "Refusing to begin a project due to anticipated future losses",
          "Overestimating the value of gains relative to losses",
          "Continuing to invest in a failing project due to previous expenditure",
          "Changing decisions based on how options are framed"
        ],
        answer: 2,
        explanation: "The passage defines the sunk cost fallacy as 'continuing to invest in a failing project because of past expenditure'."
      },
      {
        type: "gap_word",
        sentence: "The framing effect means that decisions change depending on how options are ___.",
        options: [
          "valued",
          "ranked",
          "presented",
          "compared"
        ],
        answer: 2,
        explanation: "The passage defines the framing effect as decisions changing 'depending on how options are presented', making 'presented' the correct word."
      },
      {
        type: "qa",
        q: "How does 'nudge' theory apply behavioural economics findings to public policy?",
        keywords: [
          "default",
          "choice architecture",
          "beneficial",
          "coercion"
        ],
        explanation: "According to the passage, nudge theory applies behavioural economics by using default options and choice architecture to guide people towards beneficial behaviours, crucially doing so without coercion."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Nudge theory guides people towards beneficial behaviours without forcing them to comply.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly states that nudge theory guides people towards beneficial behaviours 'without coercion', confirming this statement is true."
      },
      {
        type: "mcq",
        q: "Which academic discipline provided the insights that behavioural economics drew upon to challenge classical economics?",
        options: [
          "Sociology",
          "Neuroscience",
          "Psychology",
          "Anthropology"
        ],
        answer: 2,
        explanation: "The passage states that behavioural economics draws 'on insights from psychology' to challenge the premise of classical economics."
      },
      {
        type: "gap_word",
        sentence: "Nudge theory uses default options and choice ___ to influence decision-making.",
        options: [
          "theory",
          "architecture",
          "framework",
          "behaviour"
        ],
        answer: 1,
        explanation: "The passage uses the term 'choice architecture' alongside 'default options' as tools employed by nudge theory, making 'architecture' the correct answer."
      },
      {
        type: "qa",
        q: "Why might the framing effect be particularly significant for those designing public policy communications?",
        keywords: [
          "framing",
          "presented",
          "decisions",
          "options"
        ],
        explanation: "Because the passage states that decisions change depending on how options are presented, policymakers can influence public choices simply by altering the way information or options are framed, without changing the options themselves."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Classical economics incorporated findings from psychology when modelling human behaviour.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage implies the opposite: it is behavioural economics, not classical economics, that draws on psychology. Classical economics assumed rational utility maximisation without psychological insight."
      }
    ]
  },
  {
    id: "c1_8",
    level: "C1",
    title: "Climate Tipping Points",
    topic: "Science",
    passage: "Climate scientists warn that Earth's systems contain tipping points — thresholds beyond which self-reinforcing feedback loops drive change irreversibly. The melting of Arctic permafrost releases methane, a potent greenhouse gas, which accelerates further warming. The loss of Greenland's ice sheet would raise sea levels by approximately seven metres over centuries. Deforestation in the Amazon could transform that ecosystem from a carbon sink into a carbon source. What makes tipping points particularly dangerous is their non-linear nature: gradual change can suddenly trigger rapid, cascading consequences. Some researchers argue that multiple tipping points may interact, creating compound effects that exceed the sum of individual changes.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what makes tipping points especially hazardous?",
        options: [
          "Their non-linear nature, which can cause sudden cascading consequences",
          "The slow and predictable pace at which they develop",
          "Their exclusive dependence on human industrial activity",
          "The fact that they only affect polar regions"
        ],
        answer: 0,
        explanation: "The passage states: 'What makes tipping points particularly dangerous is their non-linear nature: gradual change can suddenly trigger rapid, cascading consequences.'"
      },
      {
        type: "gap_word",
        sentence: "The melting of Arctic permafrost releases methane, a potent greenhouse gas, which ___ further warming.",
        options: [
          "prevents",
          "monitors",
          "accelerates",
          "stabilises"
        ],
        answer: 2,
        explanation: "The passage states that released methane 'accelerates further warming', illustrating the self-reinforcing feedback loop."
      },
      {
        type: "qa",
        q: "What would be the consequence of the complete loss of Greenland's ice sheet, according to the passage?",
        keywords: [
          "sea levels",
          "seven metres",
          "centuries"
        ],
        explanation: "According to the passage, the loss of Greenland's ice sheet would raise sea levels by approximately seven metres over centuries."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Tipping points are defined as thresholds beyond which self-reinforcing feedback loops drive change irreversibly.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly defines tipping points as 'thresholds beyond which self-reinforcing feedback loops drive change irreversibly.'"
      },
      {
        type: "mcq",
        q: "What transformation does the passage warn could occur in the Amazon as a result of deforestation?",
        options: [
          "It could shift from a carbon source to a carbon sink",
          "It could shift from a carbon sink to a carbon source",
          "It could permanently lose all biodiversity",
          "It could cause sea levels to rise by seven metres"
        ],
        answer: 1,
        explanation: "The passage states that 'Deforestation in the Amazon could transform that ecosystem from a carbon sink into a carbon source.'"
      },
      {
        type: "gap_word",
        sentence: "Climate scientists warn that Earth's systems contain tipping points — thresholds beyond which self-reinforcing feedback loops drive change ___.",
        options: [
          "slowly",
          "moderately",
          "predictably",
          "irreversibly"
        ],
        answer: 3,
        explanation: "The passage describes tipping points as thresholds beyond which change is driven 'irreversibly', emphasising their permanent nature."
      },
      {
        type: "qa",
        q: "How do some researchers suggest multiple tipping points may interact with one another?",
        keywords: [
          "compound effects",
          "interact",
          "exceed",
          "individual changes"
        ],
        explanation: "Some researchers argue that multiple tipping points may interact, creating compound effects that exceed the sum of individual changes, amplifying overall impact."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "International governments have already agreed on measures to prevent Arctic permafrost from melting.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage makes no reference to any governmental agreements or policy responses regarding Arctic permafrost melting."
      },
      {
        type: "mcq",
        q: "Which of the following best describes the relationship between multiple tipping points, as presented in the passage?",
        options: [
          "They operate in complete isolation from one another",
          "They cancel each other out when they occur simultaneously",
          "They may interact to produce compound effects beyond individual impacts",
          "They only affect climate in the Amazon and Arctic regions"
        ],
        answer: 2,
        explanation: "The passage notes that 'multiple tipping points may interact, creating compound effects that exceed the sum of individual changes.'"
      },
      {
        type: "gap_word",
        sentence: "Some researchers argue that multiple tipping points may interact, creating ___ effects that exceed the sum of individual changes.",
        options: [
          "minor",
          "compound",
          "linear",
          "reversible"
        ],
        answer: 1,
        explanation: "The passage uses the word 'compound' to describe the amplified effects produced when multiple tipping points interact."
      },
      {
        type: "qa",
        q: "In what way does the passage characterise the nature of change associated with tipping points, and why is this significant?",
        keywords: [
          "non-linear",
          "gradual",
          "rapid",
          "cascading"
        ],
        explanation: "The passage characterises tipping point change as non-linear, meaning that gradual change can suddenly trigger rapid, cascading consequences, making them unpredictable and especially dangerous."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The Amazon rainforest currently functions as a carbon source rather than a carbon sink.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage implies the Amazon is currently a carbon sink, warning that deforestation 'could transform that ecosystem from a carbon sink into a carbon source' — not that it already has."
      }
    ]
  },
  {
    id: "c1_9",
    level: "C1",
    title: "Post-Colonial Identity",
    topic: "History",
    passage: "Post-colonial theory examines the lasting cultural, psychological, and political legacies of colonialism. Frantz Fanon argued that colonial rule damaged not only the material conditions of colonised peoples but their sense of self — a process he termed 'psychic alienation.' The colonised were compelled to internalise the coloniser's language, values, and history, effectively erasing indigenous identity. Homi Bhabha introduced the concept of 'hybridity' — the idea that colonised subjects do not simply replicate or reject colonial culture, but produce something new at the border between cultures. This hybrid space, he argued, is a site of both ambivalence and creative resistance.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what did Frantz Fanon mean by 'psychic alienation'?",
        options: [
          "The process by which colonised peoples internalised the coloniser's culture, erasing indigenous identity",
          "The physical displacement of colonised peoples from their homelands",
          "The economic exploitation of colonised peoples by colonial powers",
          "The rejection of colonial language and values by indigenous communities"
        ],
        answer: 0,
        explanation: "The passage states that Fanon used 'psychic alienation' to describe how the colonised were compelled to internalise the coloniser's language, values, and history, effectively erasing indigenous identity."
      },
      {
        type: "gap_word",
        sentence: "Post-colonial theory examines the lasting cultural, psychological, and ___ legacies of colonialism.",
        options: [
          "economic",
          "military",
          "political",
          "religious"
        ],
        answer: 2,
        explanation: "The passage explicitly lists 'cultural, psychological, and political legacies of colonialism' as the focus of post-colonial theory."
      },
      {
        type: "qa",
        q: "In what way did colonial rule affect colonised peoples beyond their material conditions, according to Frantz Fanon?",
        keywords: [
          "psychic alienation",
          "sense of self",
          "identity"
        ],
        explanation: "Fanon argued that colonial rule damaged the colonised peoples' sense of self through a process he called 'psychic alienation,' forcing them to internalise the coloniser's language, values, and history, which effectively erased indigenous identity."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Frantz Fanon and Homi Bhabha were contemporaries who collaborated on post-colonial theory.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage mentions both theorists but makes no reference to any collaboration or to whether they were contemporaries."
      },
      {
        type: "mcq",
        q: "According to the passage, what is distinctive about Homi Bhabha's concept of 'hybridity'?",
        options: [
          "It describes how colonised subjects completely reject colonial culture",
          "It suggests colonised subjects fully replicate colonial culture over time",
          "It proposes that colonised subjects produce something new at the border between cultures",
          "It argues that colonial culture is inevitably superior to indigenous culture"
        ],
        answer: 2,
        explanation: "The passage states that Bhabha's 'hybridity' refers to colonised subjects neither simply replicating nor rejecting colonial culture, but producing something new at the border between cultures."
      },
      {
        type: "gap_word",
        sentence: "Colonial rule damaged not only the material conditions of colonised peoples but their sense of ___, according to Fanon.",
        options: [
          "justice",
          "community",
          "self",
          "history"
        ],
        answer: 2,
        explanation: "The passage states that Fanon argued colonial rule damaged 'not only the material conditions of colonised peoples but their sense of self.'"
      },
      {
        type: "qa",
        q: "What two qualities does Homi Bhabha attribute to the hybrid space produced at the border between cultures?",
        keywords: [
          "ambivalence",
          "creative resistance",
          "hybrid space"
        ],
        explanation: "According to the passage, Bhabha described the hybrid space as 'a site of both ambivalence and creative resistance,' indicating it contains contradictory tensions alongside the potential for resistance."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The colonised were forced to adopt the coloniser's language, values, and history.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly states that 'the colonised were compelled to internalise the coloniser's language, values, and history,' which supports this statement as true."
      },
      {
        type: "mcq",
        q: "Which of the following best describes the overall scope of post-colonial theory as presented in the passage?",
        options: [
          "It focuses exclusively on the economic consequences of colonialism",
          "It addresses the cultural, psychological, and political legacies left by colonialism",
          "It is primarily concerned with the military history of colonial powers",
          "It examines only the linguistic impact of colonialism on indigenous peoples"
        ],
        answer: 1,
        explanation: "The passage opens by defining post-colonial theory as examining 'the lasting cultural, psychological, and political legacies of colonialism.'"
      },
      {
        type: "gap_word",
        sentence: "Homi Bhabha argued that the hybrid space is a site of both ambivalence and creative ___.",
        options: [
          "destruction",
          "assimilation",
          "resistance",
          "conformity"
        ],
        answer: 2,
        explanation: "The passage states that Bhabha described the hybrid space as 'a site of both ambivalence and creative resistance.'"
      },
      {
        type: "qa",
        q: "How does the passage suggest that post-colonial theory views the relationship between colonised peoples and colonial culture?",
        keywords: [
          "hybridity",
          "internalise",
          "border",
          "resistance"
        ],
        explanation: "The passage presents post-colonial theory as recognising that colonised peoples were compelled to internalise colonial culture (Fanon), but also that they did not simply replicate or reject it — instead producing something new at the cultural border, a process Bhabha termed hybridity, which can be a space of resistance."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Homi Bhabha believed that the hybrid space ultimately leads to the disappearance of indigenous culture.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that Bhabha's hybrid space is one of 'creative resistance,' implying it is not a space of cultural erasure. The idea of disappearing indigenous culture is associated with Fanon's critique of colonialism, not Bhabha's concept of hybridity."
      }
    ]
  },
  {
    id: "c1_10",
    level: "C1",
    title: "The Microbiome",
    topic: "Biology",
    passage: "The human microbiome — the trillions of microorganisms inhabiting the body, particularly the gut — is increasingly recognised as a critical component of health. Far from being passive residents, gut bacteria actively participate in digestion, synthesise vitamins, regulate the immune system, and even influence mood via the gut-brain axis. Disruptions to the microbiome, known as dysbiosis, have been associated with conditions ranging from inflammatory bowel disease to obesity and depression. Modern lifestyles — including antibiotic overuse, highly processed diets, and reduced exposure to natural environments — are thought to impoverish microbial diversity. Researchers are investigating probiotics, prebiotics, and faecal transplants as therapeutic interventions.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what is the gut-brain axis associated with?",
        options: [
          "Regulating the immune system",
          "Synthesising vitamins",
          "Influencing mood",
          "Aiding digestion"
        ],
        answer: 2,
        explanation: "The passage states that gut bacteria 'influence mood via the gut-brain axis'."
      },
      {
        type: "gap_word",
        sentence: "Disruptions to the microbiome are referred to in the passage as ___.",
        options: [
          "probiotics",
          "dysbiosis",
          "prebiotics",
          "synthesis"
        ],
        answer: 1,
        explanation: "The passage explicitly states 'Disruptions to the microbiome, known as dysbiosis'."
      },
      {
        type: "qa",
        q: "What roles do gut bacteria play in the body, according to the passage?",
        keywords: [
          "digestion",
          "vitamins",
          "immune",
          "mood"
        ],
        explanation: "According to the passage, gut bacteria actively participate in digestion, synthesise vitamins, regulate the immune system, and influence mood via the gut-brain axis."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Gut microorganisms are considered passive residents of the body.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly contradicts this, stating the bacteria are 'Far from being passive residents' and actively participate in bodily functions."
      },
      {
        type: "mcq",
        q: "Which of the following conditions is NOT mentioned in the passage as being associated with dysbiosis?",
        options: [
          "Inflammatory bowel disease",
          "Depression",
          "Obesity",
          "Alzheimer's disease"
        ],
        answer: 3,
        explanation: "The passage lists inflammatory bowel disease, obesity, and depression as conditions associated with dysbiosis, but does not mention Alzheimer's disease."
      },
      {
        type: "gap_word",
        sentence: "Modern lifestyles are thought to ___ microbial diversity.",
        options: [
          "enhance",
          "diversify",
          "impoverish",
          "stabilise"
        ],
        answer: 2,
        explanation: "The passage states that modern lifestyles 'are thought to impoverish microbial diversity'."
      },
      {
        type: "qa",
        q: "What aspects of modern lifestyles does the passage identify as harmful to the microbiome?",
        keywords: [
          "antibiotics",
          "processed",
          "natural",
          "diversity"
        ],
        explanation: "The passage identifies antibiotic overuse, highly processed diets, and reduced exposure to natural environments as factors that impoverish microbial diversity."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Faecal transplants have been proven to be the most effective treatment for dysbiosis.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage mentions faecal transplants as one of the therapeutic interventions being investigated but makes no claim about their effectiveness relative to other treatments."
      },
      {
        type: "mcq",
        q: "How does the passage describe the microbiome's relationship to health?",
        options: [
          "As a supplementary factor in disease prevention",
          "As a critical component of health",
          "As a well-understood and fully mapped system",
          "As primarily relevant to digestive health only"
        ],
        answer: 1,
        explanation: "The passage states the microbiome 'is increasingly recognised as a critical component of health'."
      },
      {
        type: "gap_word",
        sentence: "Researchers are investigating probiotics, prebiotics, and faecal transplants as therapeutic ___.",
        options: [
          "remedies",
          "experiments",
          "interventions",
          "discoveries"
        ],
        answer: 2,
        explanation: "The passage concludes by describing these approaches as 'therapeutic interventions'."
      },
      {
        type: "qa",
        q: "Where in the body does the passage indicate the microbiome is particularly concentrated?",
        keywords: [
          "gut",
          "inhabiting",
          "trillions",
          "body"
        ],
        explanation: "The passage specifies that the trillions of microorganisms inhabit 'the body, particularly the gut', indicating the gut as the primary location."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The human microbiome consists of trillions of microorganisms.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage opens by describing 'the trillions of microorganisms inhabiting the body', confirming this statement as true."
      }
    ]
  },
  {
    id: "c2_5",
    level: "C2",
    title: "The Anthropocene",
    topic: "Science",
    passage: "Geologists have proposed designating the current epoch the Anthropocene — a term acknowledging that human activity has become the dominant force shaping Earth's geology and ecosystems. Stratigraphic evidence includes novel radioisotopes from nuclear testing, a ubiquitous layer of microplastics, altered nitrogen and phosphorus cycles, and accelerating species extinction. The designation, while not yet formally ratified, carries profound philosophical weight: it compels humanity to confront its status as a geological actor responsible for consequences extending across millennia. Critics of the term argue that it risks naturalising environmental destruction by framing it as an epoch rather than a crisis demanding urgent political response.",
    questions: [
      {
        type: "mcq",
        q: "What is the primary reason geologists have proposed the term 'Anthropocene'?",
        options: [
          "Human activity has become the dominant force shaping Earth's geology and ecosystems",
          "Nuclear testing has altered the chemical composition of the atmosphere",
          "Species extinction has accelerated beyond natural geological rates",
          "Microplastics have permanently disrupted oceanic sediment layers"
        ],
        answer: 0,
        explanation: "The passage states the term acknowledges 'that human activity has become the dominant force shaping Earth's geology and ecosystems.'"
      },
      {
        type: "gap_word",
        sentence: "The Anthropocene designation is described as not yet formally ___ by stratigraphic bodies.",
        options: [
          "proposed",
          "debated",
          "ratified",
          "contested"
        ],
        answer: 2,
        explanation: "The passage explicitly states the designation is 'not yet formally ratified.'"
      },
      {
        type: "qa",
        q: "What philosophical implication does the passage attribute to the Anthropocene designation?",
        keywords: [
          "confront",
          "geological actor",
          "millennia",
          "responsibility"
        ],
        explanation: "The passage states it 'compels humanity to confront its status as a geological actor responsible for consequences extending across millennia,' meaning humans must reckon with long-term planetary accountability."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The majority of geologists support the formal ratification of the Anthropocene designation.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage mentions the designation has not been formally ratified and notes critics exist, but provides no information about majority opinion among geologists."
      },
      {
        type: "mcq",
        q: "Which of the following is cited in the passage as stratigraphic evidence for the Anthropocene?",
        options: [
          "Rising global temperatures recorded in ice cores",
          "Novel radioisotopes from nuclear testing",
          "Increased volcanic activity in tectonically active zones",
          "Widespread deforestation visible in sediment pollen records"
        ],
        answer: 1,
        explanation: "The passage lists 'novel radioisotopes from nuclear testing' among the stratigraphic evidence for the Anthropocene."
      },
      {
        type: "gap_word",
        sentence: "Altered nitrogen and phosphorus ___ are cited as part of the stratigraphic evidence for the Anthropocene.",
        options: [
          "deposits",
          "cycles",
          "compounds",
          "reserves"
        ],
        answer: 1,
        explanation: "The passage refers to 'altered nitrogen and phosphorus cycles' as part of the stratigraphic evidence."
      },
      {
        type: "qa",
        q: "What specific criticism do opponents of the Anthropocene term raise regarding its framing?",
        keywords: [
          "naturalising",
          "epoch",
          "crisis",
          "political"
        ],
        explanation: "Critics argue the term risks 'naturalising environmental destruction by framing it as an epoch rather than a crisis demanding urgent political response,' suggesting the geological framing may dilute urgency."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Microplastics constitute a ubiquitous layer within geological stratigraphic records.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly describes 'a ubiquitous layer of microplastics' as one of the items of stratigraphic evidence."
      },
      {
        type: "mcq",
        q: "According to the passage, what do critics fear the Anthropocene framing might inadvertently do?",
        options: [
          "Overstate the pace of species extinction",
          "Undermine the credibility of geological science",
          "Normalise environmental destruction rather than treating it as a crisis",
          "Shift political responsibility away from industrialised nations"
        ],
        answer: 2,
        explanation: "Critics argue the term 'risks naturalising environmental destruction by framing it as an epoch rather than a crisis demanding urgent political response.'"
      },
      {
        type: "gap_word",
        sentence: "The passage indicates that the consequences of human geological activity extend across ___.",
        options: [
          "decades",
          "centuries",
          "millennia",
          "eons"
        ],
        answer: 2,
        explanation: "The passage states humanity is 'responsible for consequences extending across millennia.'"
      },
      {
        type: "qa",
        q: "In what way does the passage present the Anthropocene as both a scientific and philosophical concept?",
        keywords: [
          "stratigraphic",
          "philosophical weight",
          "humanity",
          "geological actor"
        ],
        explanation: "The passage grounds the Anthropocene in concrete stratigraphic evidence while also noting it 'carries profound philosophical weight' by compelling humanity to confront its role as a geological actor with long-term planetary consequences."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The critics of the Anthropocene term propose an alternative epoch name to better reflect the environmental crisis.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage mentions critics' concerns about the framing but does not state that they propose any alternative designation."
      },
      {
        type: "mcq",
        q: "The passage characterises the Anthropocene designation's philosophical significance as 'profound' primarily because it does which of the following?",
        options: [
          "It formally acknowledges human civilisation as geologically superior to prior epochs",
          "It forces humanity to recognise itself as a geological agent accountable for long-lasting consequences",
          "It redefines the boundary between natural and artificial geological processes",
          "It establishes a legal framework for environmental accountability across nations"
        ],
        answer: 1,
        explanation: "The passage states the designation 'compels humanity to confront its status as a geological actor responsible for consequences extending across millennia,' which is the basis for its profound philosophical weight."
      },
      {
        type: "gap_word",
        sentence: "Accelerating species ___ is listed among the stratigraphic indicators used to support the Anthropocene designation.",
        options: [
          "migration",
          "adaptation",
          "extinction",
          "diversification"
        ],
        answer: 2,
        explanation: "The passage lists 'accelerating species extinction' as one of the pieces of stratigraphic evidence."
      },
      {
        type: "qa",
        q: "How does the passage suggest the Anthropocene term could undermine calls for immediate action on environmental issues?",
        keywords: [
          "naturalising",
          "epoch",
          "crisis",
          "urgent",
          "political response"
        ],
        explanation: "By framing environmental destruction as an epoch — a natural geological category — critics argue it risks 'naturalising' that destruction, thereby reducing the perceived urgency of the 'political response' needed to address what should be understood as a crisis."
      }
    ]
  },
  {
    id: "c2_6",
    level: "C2",
    title: "Moral Relativism",
    topic: "Philosophy",
    passage: "Moral relativism is the metaethical position that moral judgements are true or false only relative to a particular cultural or individual framework, with no universal standards to adjudicate between them. Descriptive relativism merely observes that moral beliefs vary across cultures; normative relativism goes further, claiming that this diversity is itself morally significant and that external moral critique is unwarranted. Philosophers such as James Rachels have challenged relativism by noting that it entails paralysing consequences: if morality is purely relative, we cannot condemn historical atrocities or argue for human rights. Proponents counter that universalism masks culturally specific values as objective truths, serving ideological ends.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what is the defining characteristic of moral relativism as a metaethical position?",
        options: [
          "Moral judgements are true or false only relative to a cultural or individual framework",
          "Moral beliefs are universally valid across all cultures",
          "Moral diversity should be condemned by external critique",
          "Moral judgements are neither true nor false under any circumstances"
        ],
        answer: 0,
        explanation: "The passage states that moral relativism holds that 'moral judgements are true or false only relative to a particular cultural or individual framework, with no universal standards to adjudicate between them.'"
      },
      {
        type: "gap_word",
        sentence: "Descriptive relativism merely ___ that moral beliefs vary across cultures.",
        options: [
          "denies",
          "argues",
          "observes",
          "refutes"
        ],
        answer: 2,
        explanation: "The passage states 'Descriptive relativism merely observes that moral beliefs vary across cultures,' making 'observes' the correct word."
      },
      {
        type: "qa",
        q: "What specific consequence does James Rachels argue follows from accepting moral relativism?",
        keywords: [
          "paralysing",
          "condemn",
          "atrocities",
          "human rights"
        ],
        explanation: "According to the passage, Rachels argues that if morality is purely relative, we cannot condemn historical atrocities or argue for human rights, which he describes as paralysing consequences."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Normative relativism holds that external moral critique of other cultures is entirely justified.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states normative relativism claims 'that external moral critique is unwarranted,' which is the opposite of the statement given."
      },
      {
        type: "mcq",
        q: "How does the passage distinguish normative relativism from descriptive relativism?",
        options: [
          "Normative relativism only catalogues cultural variation, while descriptive relativism makes prescriptive claims",
          "Normative relativism claims that moral diversity is itself morally significant, whereas descriptive relativism merely observes cultural variation",
          "Normative relativism accepts universal standards, while descriptive relativism rejects them",
          "Normative relativism is concerned solely with historical atrocities, while descriptive relativism addresses human rights"
        ],
        answer: 1,
        explanation: "The passage explains that descriptive relativism 'merely observes' cultural variation, while normative relativism 'goes further, claiming that this diversity is itself morally significant and that external moral critique is unwarranted.'"
      },
      {
        type: "gap_word",
        sentence: "Proponents of relativism counter that universalism ___ culturally specific values as objective truths.",
        options: [
          "reveals",
          "dismisses",
          "masks",
          "challenges"
        ],
        answer: 2,
        explanation: "The passage states that proponents argue universalism 'masks culturally specific values as objective truths,' making 'masks' the correct answer."
      },
      {
        type: "qa",
        q: "According to the passage, what purpose do relativism's proponents claim universalism serves?",
        keywords: [
          "ideological",
          "culturally specific",
          "objective truths"
        ],
        explanation: "The passage states that proponents argue universalism masks culturally specific values as objective truths, thereby 'serving ideological ends.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "James Rachels is described in the passage as a proponent of moral relativism.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that Rachels 'challenged relativism,' meaning he is a critic, not a proponent, of the position."
      },
      {
        type: "mcq",
        q: "What does the passage identify as the broader philosophical category to which moral relativism belongs?",
        options: [
          "Normative ethics",
          "Applied ethics",
          "Metaethics",
          "Descriptive ethics"
        ],
        answer: 2,
        explanation: "The passage refers to moral relativism explicitly as 'the metaethical position,' placing it within the domain of metaethics."
      },
      {
        type: "gap_word",
        sentence: "Moral relativism holds that there are no universal standards to ___ between competing moral frameworks.",
        options: [
          "adjudicate",
          "mediate",
          "reconcile",
          "eliminate"
        ],
        answer: 0,
        explanation: "The passage uses the precise phrase 'no universal standards to adjudicate between them,' making 'adjudicate' the correct answer."
      },
      {
        type: "qa",
        q: "In what way does normative relativism treat the diversity of moral beliefs, according to the passage?",
        keywords: [
          "morally significant",
          "diversity",
          "normative"
        ],
        explanation: "The passage states that normative relativism claims 'this diversity is itself morally significant,' meaning it does not merely note variation but assigns it moral weight."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The passage mentions that moral relativism has been debated extensively in political philosophy.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage does not mention political philosophy as a field of debate; this information is absent from the text."
      },
      {
        type: "mcq",
        q: "According to the passage, what is the nature of the claim made by relativism's proponents regarding universalism?",
        options: [
          "Universalism provides a neutral framework for evaluating all moral systems",
          "Universalism is a legitimate means of condemning historical atrocities",
          "Universalism presents culturally specific values under the guise of objective truths for ideological purposes",
          "Universalism accurately reflects the shared moral beliefs of all human cultures"
        ],
        answer: 2,
        explanation: "The passage states that proponents 'counter that universalism masks culturally specific values as objective truths, serving ideological ends.'"
      },
      {
        type: "gap_word",
        sentence: "Rachels argued that moral relativism entails ___ consequences for ethical reasoning.",
        options: [
          "beneficial",
          "paralysing",
          "liberating",
          "ambiguous"
        ],
        answer: 1,
        explanation: "The passage states that Rachels noted relativism 'entails paralysing consequences,' making 'paralysing' the correct word."
      },
      {
        type: "qa",
        q: "What two specific examples does the passage give to illustrate the paralysing consequences Rachels attributes to moral relativism?",
        keywords: [
          "historical atrocities",
          "human rights",
          "condemn"
        ],
        explanation: "The passage states that if morality is purely relative, 'we cannot condemn historical atrocities or argue for human rights,' these being the two examples cited by Rachels."
      }
    ]
  },
  {
    id: "c2_7",
    level: "C2",
    title: "Dark Matter and Cosmology",
    topic: "Science",
    passage: "Approximately 27 percent of the universe is believed to consist of dark matter — a substance that interacts gravitationally but emits, absorbs, or reflects no electromagnetic radiation, rendering it invisible to current instruments. Its existence is inferred from the anomalous rotation curves of galaxies, gravitational lensing observations, and the large-scale structure of the cosmos. Despite decades of research, dark matter has not been directly detected; its constituent particle — whether an axion, a weakly interacting massive particle (WIMP), or something entirely novel — remains unknown. The failure to detect WIMPs at particle accelerators has prompted cosmologists to broaden theoretical frameworks substantially.",
    questions: [
      {
        type: "mcq",
        q: "What proportion of the universe is estimated to be composed of dark matter?",
        options: [
          "Approximately 37 percent",
          "Approximately 27 percent",
          "Approximately 17 percent",
          "Approximately 47 percent"
        ],
        answer: 1,
        explanation: "The passage explicitly states that 'approximately 27 percent of the universe is believed to consist of dark matter.'"
      },
      {
        type: "gap_word",
        sentence: "Dark matter interacts ___ but emits no electromagnetic radiation.",
        options: [
          "chemically",
          "thermally",
          "gravitationally",
          "magnetically"
        ],
        answer: 2,
        explanation: "The passage states that dark matter 'interacts gravitationally but emits, absorbs, or reflects no electromagnetic radiation.'"
      },
      {
        type: "qa",
        q: "Why is dark matter considered invisible to current scientific instruments?",
        keywords: [
          "electromagnetic",
          "radiation",
          "emits",
          "absorbs",
          "reflects"
        ],
        explanation: "Dark matter is invisible because it neither emits, absorbs, nor reflects any electromagnetic radiation, which means conventional instruments that detect such radiation cannot observe it."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Dark matter has been directly detected at least once in a controlled laboratory environment.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage clearly states that 'dark matter has not been directly detected,' making this statement false."
      },
      {
        type: "mcq",
        q: "Which of the following is NOT cited in the passage as evidence from which dark matter's existence is inferred?",
        options: [
          "Gravitational lensing observations",
          "Anomalous rotation curves of galaxies",
          "The large-scale structure of the cosmos",
          "Fluctuations in cosmic background radiation"
        ],
        answer: 3,
        explanation: "The passage lists anomalous rotation curves, gravitational lensing, and large-scale structure as evidence, but makes no mention of cosmic background radiation fluctuations."
      },
      {
        type: "gap_word",
        sentence: "The constituent ___ of dark matter, whether an axion or a WIMP, remains unknown.",
        options: [
          "force",
          "field",
          "particle",
          "element"
        ],
        answer: 2,
        explanation: "The passage refers to 'its constituent particle — whether an axion, a weakly interacting massive particle (WIMP), or something entirely novel — remains unknown.'"
      },
      {
        type: "qa",
        q: "What consequence has the failure to detect WIMPs at particle accelerators had on the field of cosmology?",
        keywords: [
          "broaden",
          "theoretical",
          "frameworks",
          "cosmologists"
        ],
        explanation: "The failure to detect WIMPs at particle accelerators has prompted cosmologists to broaden their theoretical frameworks substantially, moving beyond the WIMP-centric model."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "An axion is one of the candidate particles proposed as the constituent of dark matter.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 0,
        explanation: "The passage explicitly lists 'an axion' alongside a WIMP as possible constituent particles of dark matter."
      },
      {
        type: "mcq",
        q: "What does the term 'WIMP' stand for as used in the passage?",
        options: [
          "Weakly Integrated Magnetic Particle",
          "Weakly Interacting Massive Particle",
          "Widely Inferred Matter Particle",
          "Weakly Ionised Matter Particle"
        ],
        answer: 1,
        explanation: "The passage defines WIMP as a 'weakly interacting massive particle' in parentheses immediately after the acronym."
      },
      {
        type: "gap_word",
        sentence: "The existence of dark matter is ___ from several astrophysical observations.",
        options: [
          "fabricated",
          "inferred",
          "measured",
          "disputed"
        ],
        answer: 1,
        explanation: "The passage states that dark matter's 'existence is inferred from' anomalous rotation curves, gravitational lensing, and large-scale structure."
      },
      {
        type: "qa",
        q: "In what three ways does dark matter fail to interact with electromagnetic radiation, according to the passage?",
        keywords: [
          "emits",
          "absorbs",
          "reflects",
          "electromagnetic"
        ],
        explanation: "According to the passage, dark matter neither emits, absorbs, nor reflects electromagnetic radiation, which collectively renders it invisible to current instruments."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Researchers have been investigating dark matter for only a few years.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage refers to 'decades of research,' indicating the field has been active for a substantially longer period than a few years."
      },
      {
        type: "mcq",
        q: "Which phrase best captures the reason the passage gives for cosmologists substantially broadening their theoretical frameworks?",
        options: [
          "The identification of axions as the primary dark matter candidate",
          "The discovery of novel electromagnetic signals from dark matter",
          "The failure to detect WIMPs at particle accelerators",
          "The inability to observe gravitational lensing accurately"
        ],
        answer: 2,
        explanation: "The passage directly states: 'The failure to detect WIMPs at particle accelerators has prompted cosmologists to broaden theoretical frameworks substantially.'"
      },
      {
        type: "gap_word",
        sentence: "Dark matter renders itself ___ to all current scientific instruments due to its lack of electromagnetic interaction.",
        options: [
          "detectable",
          "measurable",
          "invisible",
          "negligible"
        ],
        answer: 2,
        explanation: "The passage uses the word 'invisible' to describe dark matter's undetectability: 'rendering it invisible to current instruments.'"
      },
      {
        type: "qa",
        q: "To what extent does the passage suggest the identity of dark matter's constituent particle is resolved?",
        keywords: [
          "unknown",
          "novel",
          "remains",
          "constituent"
        ],
        explanation: "The passage indicates that the identity of dark matter's constituent particle is entirely unresolved, noting it 'remains unknown' and may be 'something entirely novel,' beyond known candidates such as axions or WIMPs."
      }
    ]
  },
  {
    id: "c2_8",
    level: "C2",
    title: "The Limits of Language",
    topic: "Linguistics",
    passage: "Wittgenstein's later philosophy introduced the concept of language games — the idea that words acquire meaning not from picturing facts but from their use within specific forms of life. This fundamentally challenged the representationalist view that language is a mirror of reality. The Sapir-Whorf hypothesis, in its strong form, proposes that the language one speaks shapes — or even determines — the categories in which one thinks. Empirical evidence supports a weaker version: speakers of languages with richer spatial or temporal vocabulary do show measurable differences in cognitive tasks. Yet critics contend that the universality of certain logical concepts across languages suggests cognitive architecture independent of linguistic structures.",
    questions: [
      {
        type: "mcq",
        q: "According to Wittgenstein's later philosophy, words derive their meaning from:",
        options: [
          "their capacity to mirror external reality",
          "their use within specific forms of life",
          "their logical relationship to universal concepts",
          "their correspondence to innate cognitive categories"
        ],
        answer: 1,
        explanation: "The passage states that in Wittgenstein's later philosophy, 'words acquire meaning not from picturing facts but from their use within specific forms of life.'"
      },
      {
        type: "gap_word",
        sentence: "Wittgenstein's concept of language games fundamentally challenged the ___ view that language is a mirror of reality.",
        options: [
          "empiricist",
          "rationalist",
          "representationalist",
          "structuralist"
        ],
        answer: 2,
        explanation: "The passage explicitly states that Wittgenstein's ideas 'fundamentally challenged the representationalist view that language is a mirror of reality.'"
      },
      {
        type: "qa",
        q: "What does Wittgenstein's notion of 'forms of life' imply about the relationship between language and meaning?",
        keywords: [
          "use",
          "context",
          "practice",
          "meaning"
        ],
        explanation: "The passage implies that meaning is not intrinsic or referential but arises from situated human practices and activities — 'forms of life' — within which language is used, rejecting the idea that words picture facts."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Wittgenstein's later philosophy was directly influenced by the Sapir-Whorf hypothesis.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage discusses Wittgenstein and the Sapir-Whorf hypothesis separately and does not establish any direct influence between them."
      },
      {
        type: "mcq",
        q: "The strong form of the Sapir-Whorf hypothesis asserts that language:",
        options: [
          "weakly influences the speed of cognitive processing",
          "shapes or even determines the categories of thought",
          "is universally structured around the same logical concepts",
          "acquires meaning through social forms of life"
        ],
        answer: 1,
        explanation: "The passage states that 'the strong form [of the Sapir-Whorf hypothesis] proposes that the language one speaks shapes — or even determines — the categories in which one thinks.'"
      },
      {
        type: "gap_word",
        sentence: "Empirical evidence is said to support a ___ version of the Sapir-Whorf hypothesis rather than its strong form.",
        options: [
          "modified",
          "contested",
          "weaker",
          "theoretical"
        ],
        answer: 2,
        explanation: "The passage explicitly states: 'Empirical evidence supports a weaker version,' contrasting it with the strong form of the hypothesis."
      },
      {
        type: "qa",
        q: "What specific empirical finding does the passage cite in support of the weaker version of the Sapir-Whorf hypothesis?",
        keywords: [
          "spatial",
          "temporal",
          "vocabulary",
          "cognitive",
          "measurable"
        ],
        explanation: "The passage notes that 'speakers of languages with richer spatial or temporal vocabulary do show measurable differences in cognitive tasks,' which supports the weaker version of linguistic relativity."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Speakers of languages with richer spatial vocabulary outperform others on all cognitive tasks.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage says speakers show 'measurable differences in cognitive tasks,' not that they outperform others on all cognitive tasks — the claim is more limited and qualified."
      },
      {
        type: "mcq",
        q: "What argument do critics of the Sapir-Whorf hypothesis put forward against linguistic determinism?",
        options: [
          "Spatial reasoning is language-dependent across all cultures",
          "Certain logical concepts are universal across languages",
          "Cognitive tasks cannot be measured cross-linguistically",
          "Wittgenstein's language games refute the hypothesis"
        ],
        answer: 1,
        explanation: "The passage states that 'critics contend that the universality of certain logical concepts across languages suggests cognitive architecture independent of linguistic structures.'"
      },
      {
        type: "gap_word",
        sentence: "Critics argue that the universality of certain logical concepts across languages suggests a cognitive ___ independent of linguistic structures.",
        options: [
          "flexibility",
          "development",
          "architecture",
          "relativity"
        ],
        answer: 2,
        explanation: "The passage uses the exact phrase 'cognitive architecture independent of linguistic structures' in presenting the critics' position."
      },
      {
        type: "qa",
        q: "How does the critics' position regarding universal logical concepts challenge the core claim of the Sapir-Whorf hypothesis?",
        keywords: [
          "universal",
          "independent",
          "language",
          "cognitive",
          "structure"
        ],
        explanation: "If certain logical concepts appear universally across languages, this suggests that cognition has an underlying architecture not shaped by language, directly contradicting the Sapir-Whorf claim that language determines or shapes thought categories."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The weaker version of the Sapir-Whorf hypothesis has been entirely discredited by empirical research.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly states the opposite: 'Empirical evidence supports a weaker version,' indicating it has not been discredited."
      },
      {
        type: "mcq",
        q: "In what respect does Wittgenstein's concept of language games most directly contradict representationalism?",
        options: [
          "It claims language is shaped by biological cognitive structures",
          "It denies that words picture or mirror facts",
          "It proposes that meaning is culturally universal",
          "It argues that spatial vocabulary determines cognition"
        ],
        answer: 1,
        explanation: "The passage states that language games challenge 'the representationalist view that language is a mirror of reality,' with words gaining meaning from use rather than from picturing facts."
      },
      {
        type: "gap_word",
        sentence: "Language games involve words acquiring meaning from their ___ within specific forms of life, not from picturing facts.",
        options: [
          "structure",
          "origin",
          "use",
          "translation"
        ],
        answer: 2,
        explanation: "The passage states that 'words acquire meaning not from picturing facts but from their use within specific forms of life.'"
      },
      {
        type: "qa",
        q: "To what extent does the passage suggest that the debate between linguistic relativity and cognitive universalism has been resolved?",
        keywords: [
          "unresolved",
          "critics",
          "evidence",
          "weaker",
          "universal"
        ],
        explanation: "The passage presents both supporting empirical evidence for a weaker form of linguistic relativity and the critics' counter-argument about universal logical concepts, suggesting the debate remains open and unresolved rather than settled in either direction."
      }
    ]
  },
  {
    id: "c2_9",
    level: "C2",
    title: "Free Will and Determinism",
    topic: "Philosophy",
    passage: "The problem of free will asks whether human choices are genuinely self-originated or merely the inevitable product of prior causes — neural states, genetics, upbringing, and physical laws. Hard determinists argue that every event, including mental states, is causally necessitated; free will is thus an illusion. Libertarians (in the metaphysical sense) maintain that at least some actions escape causal determination, perhaps via quantum indeterminacy or irreducible agency. Compatibilists offer a middle path: free will and determinism are not mutually exclusive; genuine freedom consists in acting according to one's own desires and reasons unimpeded by external coercion, regardless of whether those desires are causally determined.",
    questions: [
      {
        type: "mcq",
        q: "According to the passage, what is the central question posed by the problem of free will?",
        options: [
          "Whether human choices are truly self-originated or the inevitable result of prior causes",
          "Whether quantum indeterminacy can override genetic determinism",
          "Whether neural states are more influential than upbringing in shaping behaviour",
          "Whether compatibilism offers a more scientifically valid account than libertarianism"
        ],
        answer: 0,
        explanation: "The passage opens by stating the problem asks 'whether human choices are genuinely self-originated or merely the inevitable product of prior causes.'"
      },
      {
        type: "gap_word",
        sentence: "Hard determinists contend that every event, including mental states, is causally ___, making free will an illusion.",
        options: [
          "contested",
          "necessitated",
          "circumvented",
          "fabricated"
        ],
        answer: 1,
        explanation: "The passage states hard determinists argue 'every event, including mental states, is causally necessitated.'"
      },
      {
        type: "qa",
        q: "What mechanisms does the passage suggest metaphysical libertarians invoke to explain how some actions might escape causal determination?",
        keywords: [
          "quantum indeterminacy",
          "irreducible agency",
          "libertarians"
        ],
        explanation: "The passage states libertarians maintain some actions escape causal determination 'perhaps via quantum indeterminacy or irreducible agency.'"
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Hard determinists believe that mental states are exempt from causal necessitation, even though physical events are not.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage explicitly states hard determinists argue 'every event, including mental states, is causally necessitated,' meaning mental states are not exempt."
      },
      {
        type: "mcq",
        q: "How does the passage characterise the compatibilist position in relation to free will and determinism?",
        options: [
          "Compatibilists reject determinism entirely in favour of libertarian agency",
          "Compatibilists assert that free will and determinism are not mutually exclusive",
          "Compatibilists argue that external coercion is necessary for genuine freedom",
          "Compatibilists maintain that quantum indeterminacy underpins authentic choice"
        ],
        answer: 1,
        explanation: "The passage states compatibilists hold that 'free will and determinism are not mutually exclusive.'"
      },
      {
        type: "gap_word",
        sentence: "The passage lists neural states, genetics, upbringing, and physical laws as examples of ___ causes that may determine human choices.",
        options: [
          "spontaneous",
          "metaphysical",
          "prior",
          "external"
        ],
        answer: 2,
        explanation: "The passage refers to these factors as 'prior causes' that may make choices 'the inevitable product' of such influences."
      },
      {
        type: "qa",
        q: "According to the passage, what specific condition must be met for compatibilists to consider an action genuinely free?",
        keywords: [
          "desires",
          "reasons",
          "coercion",
          "unimpeded"
        ],
        explanation: "The passage specifies that compatibilist freedom consists in 'acting according to one's own desires and reasons unimpeded by external coercion,' irrespective of causal determination."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Metaphysical libertarians, as described in the passage, are necessarily committed to a religious or theological explanation of human agency.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 2,
        explanation: "The passage makes no reference to religious or theological explanations; it only mentions quantum indeterminacy and irreducible agency as possible libertarian mechanisms."
      },
      {
        type: "mcq",
        q: "Which of the following best describes the passage's use of the term 'Libertarians'?",
        options: [
          "It refers to a political ideology advocating minimal state intervention",
          "It denotes those who believe all actions are causally necessitated",
          "It refers to a metaphysical position holding that some actions escape causal determination",
          "It describes thinkers who equate freedom with compliance with physical laws"
        ],
        answer: 2,
        explanation: "The passage explicitly qualifies the term, noting 'Libertarians (in the metaphysical sense) maintain that at least some actions escape causal determination.'"
      },
      {
        type: "gap_word",
        sentence: "Compatibilists contend that genuine freedom consists in acting according to one's own desires and reasons, free from external ___.",
        options: [
          "determination",
          "coercion",
          "reasoning",
          "causation"
        ],
        answer: 1,
        explanation: "The passage states compatibilist freedom requires acting 'unimpeded by external coercion.'"
      },
      {
        type: "qa",
        q: "In what sense does the passage describe compatibilism as a 'middle path'?",
        keywords: [
          "free will",
          "determinism",
          "mutually exclusive",
          "middle"
        ],
        explanation: "Compatibilism is a middle path because it rejects the assumption that free will and determinism are mutually exclusive, reconciling both by redefining freedom as acting on one's own desires without external coercion, even if those desires are causally determined."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The compatibilist definition of freedom requires that a person's desires themselves must not be causally determined.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states compatibilists hold freedom is genuine 'regardless of whether those desires are causally determined,' directly contradicting this claim."
      },
      {
        type: "mcq",
        q: "Which of the following does the passage identify as one of the prior causes that hard determinists would cite in explaining human mental states?",
        options: [
          "Irreducible agency",
          "Quantum indeterminacy",
          "Genetics",
          "External coercion"
        ],
        answer: 2,
        explanation: "The passage lists 'genetics' among the prior causes — 'neural states, genetics, upbringing, and physical laws' — that hard determinists would invoke."
      },
      {
        type: "gap_word",
        sentence: "Hard determinists conclude that free will is an ___, given that all events are causally necessitated.",
        options: [
          "achievement",
          "illusion",
          "abstraction",
          "inevitability"
        ],
        answer: 1,
        explanation: "The passage states that for hard determinists, 'free will is thus an illusion.'"
      },
      {
        type: "qa",
        q: "How does the passage distinguish between the hard determinist and the compatibilist treatment of causally determined desires?",
        keywords: [
          "hard determinist",
          "compatibilist",
          "determined",
          "illusion",
          "freedom"
        ],
        explanation: "Hard determinists treat causal determination of mental states as proof that free will is an illusion, whereas compatibilists accept that desires may be causally determined yet still consider action based on those desires genuinely free, provided there is no external coercion."
      }
    ]
  },
  {
    id: "c2_10",
    level: "C2",
    title: "Tragedy and Catharsis",
    topic: "Literature",
    passage: "Aristotle defined tragedy as an imitation of a serious, complete action of sufficient magnitude, effecting through pity and fear the catharsis of such emotions. The notion of catharsis — typically translated as purging or purification — has generated centuries of scholarly debate. Some interpret it medically: tragedy evacuates pent-up emotions, restoring psychological equilibrium. Others read it cognitively: through engaging with fictional suffering, audiences refine their emotional intelligence and moral understanding. Nietzsche challenged the Aristotelian account entirely, arguing that tragedy's power lies not in purging suffering but in affirming it — confronting the Dionysian chaos of existence without retreating into comforting illusions. Contemporary theorists draw on both traditions to analyse how narrative art mediates human responses to mortality and injustice.",
    questions: [
      {
        type: "mcq",
        q: "According to Aristotle's definition as presented in the passage, which element is explicitly identified as a defining characteristic of tragedy?",
        options: [
          "The depiction of heroic virtue overcoming adversity",
          "An imitation of a serious, complete action of sufficient magnitude",
          "A narrative structured around divine intervention and fate",
          "The representation of historical events through dramatic performance"
        ],
        answer: 1,
        explanation: "The passage states Aristotle defined tragedy as 'an imitation of a serious, complete action of sufficient magnitude,' making option B the direct and accurate reflection of the text."
      },
      {
        type: "gap_word",
        sentence: "The notion of catharsis has typically been translated as purging or ___.",
        options: [
          "transformation",
          "suppression",
          "purification",
          "resolution"
        ],
        answer: 2,
        explanation: "The passage states catharsis is 'typically translated as purging or purification,' making 'purification' the correct completion of this sentence."
      },
      {
        type: "qa",
        q: "How does the medical interpretation of catharsis, as described in the passage, account for the psychological effect of tragedy on its audience?",
        keywords: [
          "evacuates",
          "pent-up",
          "equilibrium",
          "emotions"
        ],
        explanation: "According to the medical interpretation described in the passage, tragedy evacuates pent-up emotions, thereby restoring psychological equilibrium in the audience."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "The scholarly debate surrounding the concept of catharsis is a relatively recent development in literary criticism.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that catharsis 'has generated centuries of scholarly debate,' directly contradicting the claim that it is a recent development."
      },
      {
        type: "mcq",
        q: "What does the cognitive interpretation of catharsis, as outlined in the passage, suggest audiences gain from engaging with fictional suffering?",
        options: [
          "A temporary escape from their own psychological distress",
          "Refined emotional intelligence and moral understanding",
          "A heightened awareness of their own mortality and fragility",
          "The capacity to suppress disruptive emotional responses"
        ],
        answer: 1,
        explanation: "The passage specifies that under the cognitive interpretation, 'audiences refine their emotional intelligence and moral understanding' through engaging with fictional suffering."
      },
      {
        type: "gap_word",
        sentence: "Nietzsche argued that tragedy's power lies in ___ suffering rather than purging it.",
        options: [
          "concealing",
          "aestheticising",
          "affirming",
          "transcending"
        ],
        answer: 2,
        explanation: "The passage states Nietzsche argued tragedy's power lies 'not in purging suffering but in affirming it,' making 'affirming' the correct answer."
      },
      {
        type: "qa",
        q: "In what specific way does Nietzsche's conception of tragedy differ fundamentally from the Aristotelian account, as presented in the passage?",
        keywords: [
          "Dionysian",
          "chaos",
          "affirming",
          "illusions"
        ],
        explanation: "Nietzsche challenged the Aristotelian account by arguing that tragedy's power lies not in purging suffering but in affirming it — confronting the Dionysian chaos of existence without retreating into comforting illusions, rather than restoring equilibrium."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Nietzsche believed that tragedy should offer its audience consolatory illusions as a means of managing existential suffering.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states Nietzsche valued tragedy for 'confronting the Dionysian chaos of existence without retreating into comforting illusions,' explicitly opposing the use of consolatory illusions."
      },
      {
        type: "mcq",
        q: "Which phrase in the passage best characterises Nietzsche's view of the fundamental nature of existence that tragedy must confront?",
        options: [
          "Pent-up emotional turmoil",
          "Fictional suffering",
          "Dionysian chaos",
          "Psychological equilibrium"
        ],
        answer: 2,
        explanation: "The passage uses the phrase 'Dionysian chaos of existence' to describe what Nietzsche believed tragedy must confront, distinguishing his view from Aristotelian catharsis."
      },
      {
        type: "gap_word",
        sentence: "Contemporary theorists draw on both traditions to analyse how narrative art ___ human responses to mortality and injustice.",
        options: [
          "suppresses",
          "mediates",
          "provokes",
          "documents"
        ],
        answer: 1,
        explanation: "The passage concludes by stating that contemporary theorists analyse 'how narrative art mediates human responses to mortality and injustice,' making 'mediates' the correct answer."
      },
      {
        type: "qa",
        q: "What are the two specific human concerns that contemporary theorists, according to the passage, focus on when examining how narrative art functions?",
        keywords: [
          "mortality",
          "injustice",
          "narrative",
          "mediate"
        ],
        explanation: "The passage states that contemporary theorists analyse how narrative art mediates human responses to 'mortality and injustice,' identifying these as the two specific concerns."
      },
      {
        type: "tfnm",
        instruction: "According to the passage...",
        q: "Contemporary theorists have decisively rejected Nietzsche's account of tragedy in favour of the Aristotelian tradition.",
        options: [
          "True",
          "False",
          "Not Mentioned"
        ],
        answer: 1,
        explanation: "The passage states that contemporary theorists 'draw on both traditions,' indicating they engage with both Aristotelian and Nietzschean perspectives rather than rejecting either."
      },
      {
        type: "mcq",
        q: "Which of the following most accurately describes the relationship between the medical and cognitive interpretations of catharsis as presented in the passage?",
        options: [
          "They are presented as mutually exclusive and contradictory positions",
          "They are distinct scholarly readings that co-exist within ongoing debate",
          "The cognitive interpretation is explicitly identified as superseding the medical one",
          "They are shown to have been synthesised into a single contemporary theory"
        ],
        answer: 1,
        explanation: "The passage presents both interpretations as distinct scholarly readings within 'centuries of scholarly debate' without suggesting one supersedes the other or that they have been unified."
      },
      {
        type: "gap_word",
        sentence: "The Aristotelian definition specifies that tragedy effects catharsis through pity and ___.",
        options: [
          "awe",
          "fear",
          "grief",
          "wonder"
        ],
        answer: 1,
        explanation: "The passage directly quotes Aristotle's definition as 'effecting through pity and fear the catharsis of such emotions,' making 'fear' the correct answer."
      },
      {
        type: "qa",
        q: "Based on the passage, what is the scope of the scholarly engagement with the concept of catharsis, and what does this suggest about its intellectual significance?",
        keywords: [
          "centuries",
          "debate",
          "scholarly",
          "interpretation"
        ],
        explanation: "The passage states that catharsis 'has generated centuries of scholarly debate,' with both medical and cognitive interpretations persisting, suggesting it remains a contested concept of enduring intellectual significance rather than one with a settled meaning."
      }
    ]
  }
];
