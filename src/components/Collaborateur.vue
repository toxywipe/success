<template>
  <div class="box-principale">
    <div v-if="!showDebutTest">
      <div class="header">
        <h1>Accueil Collaborateur</h1>
        <div class="user-info">
          <span>{{ authStore.user }}</span>
          <button @click="logout" class="logout-button">Déconnexion</button>
        </div>
      </div>

      <div class="collaborateur-container">
        <div class="main-content">
          <div class="sidebar">
            <button class="sidebar-btn">Statistiques</button>
          </div>

          <div class="questionnaire-section">
            <div class="code-input">
              <label for="code">CODE :</label>
              <input type="text" id="code" v-model="inputCode" placeholder="*code*" />
              <button class="code-btn" @click="checkCode">OK</button>
            </div>

            <div v-if="questionnaireData">
              <h3>Nom du questionnaire :</h3>
              <p>{{ questionnaireData.nom }}</p>
              <h3>Temps du questionnaire :</h3>
              <p>{{ questionnaireData.temps_de_passage }} minutes</p>
              <h3>Note sur :</h3>
              <p>{{ totalPoints }} points</p>

              <button class="start-btn" @click="startEvaluation">Démarrer</button>
            </div>

            <div class="questionnaire-list">
              <h3>Questionnaires réalisés :</h3>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Date de création</th>
                    <th>Temps de passage</th>
                    <th>Date</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="passage in passages" :key="passage.id_passer">
                    <td>{{ passage.nom_questionnaire }}</td>
                    <td>{{ formatDate(passage.date_creation) }}</td>
                    <td>{{ passage.temps_de_passage }} minutes</td>
                    <td>{{ formatDate(passage.date) }}</td>
                    <td>{{ passage.note }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    <DebutTest v-if="showDebutTest" :username="username" :questionnaire="questionnaireData" @startEvaluation="showEvaluation = true" />
    <Evaluation v-if="showEvaluation" :username="username" :questionnaire="questionnaireData" :questions="questions" />
    <router-view></router-view>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/authStore';
import DebutTest from './DebutTest.vue';
import Evaluation from './Evaluation.vue';

const authStore = useAuthStore();
const router = useRouter();
const passages = ref([]);
const inputCode = ref('');
const questionnaireData = ref(null);
const showDebutTest = ref(false);
const showEvaluation = ref(false);
const totalPoints = ref(0);
const questions = ref([]);

const logout = () => {
  authStore.logout();
  router.push('/');
};

const fetchPassages = async () => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('utilisateur')
      .select('id_utilisateur')
      .eq('pseudo', authStore.user)
      .single();

    if (userError) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', userError);
      return;
    }

    const userId = userData.id_utilisateur;

    const { data: passagesData, error: passagesError } = await supabase
      .from('passer')
      .select('id_passer, date, note, id_questionnaire')
      .eq('id_utilisateur', userId)
      .order('date', { ascending: false });

    if (passagesError) {
      console.error('Erreur lors de la récupération des passages:', passagesError);
      return;
    }

    const questionnaireIds = passagesData.map(p => p.id_questionnaire);
    const { data: questionnairesData, error: questionnairesError } = await supabase
      .from('questionnaire')
      .select('id_questionnaire, nom, date_creation, temps_de_passage')
      .in('id_questionnaire', questionnaireIds);

    if (questionnairesError) {
      console.error('Erreur lors de la récupération des questionnaires:', questionnairesError);
      return;
    }

    passages.value = passagesData.map(passage => {
      const questionnaire = questionnairesData.find(q => q.id_questionnaire === passage.id_questionnaire);
      return {
        ...passage,
        nom_questionnaire: questionnaire.nom,
        date_creation: questionnaire.date_creation,
        temps_de_passage: questionnaire.temps_de_passage
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des passages:', error);
  }
};

const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('fr-FR', options);
};

const checkCode = async () => {
  try {
    const { data, error } = await supabase
      .from('questionnaire')
      .select('id_questionnaire, nom, temps_de_passage, code')
      .eq('code', inputCode.value)
      .single();

    if (error || !data) {
      alert('Code incorrect');
    } else {
      questionnaireData.value = data;
      totalPoints.value = await fetchTotalPoints(data.id_questionnaire);
      showDebutTest.value = true;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du code :", error);
    alert('Erreur lors de la vérification du code');
  }
};

const fetchTotalPoints = async (questionnaireId) => {
  const { data, error } = await supabase
    .from('question')
    .select('points')
    .eq('id_questionnaire', questionnaireId);

  if (error) {
    console.error('Erreur lors de la récupération des points totaux :', error);
    return 0;
  } else {
    return data.reduce((acc, question) => acc + question.points, 0);
  }
};

const startEvaluation = async () => {
  showEvaluation.value = true;
  const { data: questionsData, error: questionsError } = await supabase
    .from('contenir')
    .select('question.*')
    .eq('id_questionnaire', questionnaireData.value.id_questionnaire)
    .join('question', 'contenir.id_question', 'question.id_question');

  if (questionsError) {
    console.error('Erreur lors de la récupération des questions :', questionsError);
  } else {
    questions.value = questionsData;
  }
};

onMounted(() => {
  fetchPassages();
});
</script>

<style scoped>
.box-principale {
  box-shadow: #ccc;
}
.header {
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  width: 98%;
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

.logout-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #b48ac6;
}

.collaborateur-container {
  background-color: #f5f5f5;
  padding: 80px 20px 20px;
}

.main-content {
  display: flex;
  width: 100%;
  margin-top: 20px;
}

.sidebar {
  width: 200px;
  background-color: #d9d9d9;
  padding: 10px;
}

.sidebar-btn {
  width: 100%;
  padding: 10px;
  font-size: 1.2rem;
  background-color: #d9d9d9;
  color: black;
  border: none;
  text-align: center;
  cursor: pointer;
}

.questionnaire-section {
  flex: 1;
  padding: 20px;
}

.code-input {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.code-input label {
  font-size: 1.1rem;
  margin-right: 10px;
}

.code-input input {
  padding: 5px;
  width: 100px;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.code-btn {
  margin-left: 10px;
  padding: 5px 10px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border-radius: 10px;
  cursor: pointer;
}

.start-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 20px;
}

.questionnaire-list h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  text-align: left;
}

.back-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #c59edb;
  color: white;
  border: none;
  cursor: pointer;
}
</style>