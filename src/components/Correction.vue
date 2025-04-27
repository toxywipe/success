<template>
  <div class="correction">
    <div class="header">
      <h1>Correction</h1>
      <div class="user-info">
        <span>{{ username }}</span>
        <button @click="goBack">Retour</button>
      </div>
    </div>
    
    <div class="questionnaire-content">
      <h2>QUESTION n°{{ currentQuestion + 1 }} / {{ questions.length }}</h2>

      <!-- Affichage de la question et des réponses -->
      <div class="question-section">
        <div class="question">{{ questions[currentQuestion]?.titre }}</div>
        <div class="answers">
          <div
            v-for="(answer, index) in answers[currentQuestion]"
            :key="index"
            :class="{
              correct: answer.etre_bonne_reponse,
              incorrect: !answer.etre_bonne_reponse && selectedAnswers[currentQuestion]?.id_reponse === answer.id_reponse
            }"
          >
            {{ answer.titre }}
          </div>
        </div>
      </div>

      <!-- Navigation entre les questions -->
      <div class="navigation">
        <button class="btn back" @click="prevQuestion" :disabled="currentQuestion === 0">← Précédente</button>
        <button class="btn next" @click="nextQuestion" :disabled="currentQuestion === questions.length - 1">Suivante →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';

const props = defineProps({
  username: {
    type: String,
    required: true
  },
  idQuestionnaire: {
    type: Number,
    required: true
  },
  idUtilisateur: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['goBack']);
const currentQuestion = ref(0);
const questions = ref([]);
const answers = ref([]);
const selectedAnswers = ref([]);

// Récupérer les données de la correction
const fetchCorrection = async () => {
  try {
    // Récupérer les questions liées au questionnaire
    const { data: questionsData, error: questionsError } = await supabase
      .from('question')
      .select('id_question, titre')
      .in('id_question', supabase
        .from('contenir')
        .select('id_question')
        .eq('id_questionnaire', props.idQuestionnaire)
      );

    if (questionsError) throw questionsError;
    questions.value = questionsData;

    // Récupérer les réponses possibles pour chaque question
    for (const question of questionsData) {
      const { data: answersData, error: answersError } = await supabase
        .from('reponse')
        .select('id_reponse, titre, etre_bonne_reponse')
        .eq('id_question', question.id_question);

      if (answersError) throw answersError;
      answers.value.push(answersData);
    }

    // Récupérer les réponses sélectionnées par l'utilisateur
    const { data: selectedAnswersData, error: selectedAnswersError } = await supabase
      .from('reponse_utilisateur')
      .select('id_question, id_reponse')
      .eq('id_utilisateur', props.idUtilisateur)
      .eq('id_questionnaire', props.idQuestionnaire);

    if (selectedAnswersError) throw selectedAnswersError;
    selectedAnswers.value = selectedAnswersData.reduce((acc, answer) => {
      acc[answer.id_question] = answer;
      return acc;
    }, {});
  } catch (error) {
    console.error("Erreur lors de la récupération des corrections :", error);
  }
};

// Fonction pour afficher la question précédente
const prevQuestion = () => {
  if (currentQuestion.value > 0) {
    currentQuestion.value--;
  }
};

// Fonction pour afficher la question suivante
const nextQuestion = () => {
  if (currentQuestion.value < questions.value.length - 1) {
    currentQuestion.value++;
  }
};

// Fonction pour revenir à la page précédente
const goBack = () => {
  emit('goBack');  // Emmet un événement pour revenir à la page précédente
};

// Récupérer les données de correction lors du montage
onMounted(() => {
  fetchCorrection();
});
</script>

<style scoped>
.correction {
  font-family: Arial, sans-serif;
  color: #333;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  border-radius: 10px;
  width: 100%;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  color: white;
  font-size: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-info span {
  margin-right: 20px;
  color: white;
  font-size: 1rem;
}

.user-info button {
  background-color: white;
  color: #c59edb;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
}

.user-info button:hover {
  background-color: #b48ac6;
}

.questionnaire-content {
  margin-top: 20px;
  margin-right: 0px;
  background-color: #f7f7f7;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.question-section {
  margin: 20px 0;
}

.answers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.answers div {
  padding: 10px;
  border-radius: 5px;
  font-size: 16px;
}

.answers div.correct {
  background-color: #d4edda;
  color: #155724;
}

.answers div.incorrect {
  background-color: #f8d7da;
  color: #721c24;
}

.navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.navigation .btn {
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.navigation .btn:hover {
  background-color: #a070c2;
}
</style>
