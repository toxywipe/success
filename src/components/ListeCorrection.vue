<template>
  <header>
    <h1>Correction des Questionnaires</h1>
  </header>
  <div>
    <!-- Barre de recherche -->
    <div>
      <input 
        type="text"
        v-model="searchQuery"
        placeholder="Rechercher un utilisateur"
        @input="filterPassages"
        class="search-bar"
      />
    </div>

    <!-- Tableau des passages -->
    <div class="table-container" v-if="!selectedPassage">
      <table>
        <thead>
          <tr>
            <th>Nom du Questionnaire</th>
            <th>Utilisateur</th>
            <th>Note</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="passage in filteredPassages" :key="passage.id_passer">
            <td @click="showCorrection(passage)">{{ passage.nom_questionnaire }}</td>
            <td>{{ passage.utilisateur }}</td>
            <td>{{ passage.note }}</td>
            <td>{{ formatDate(passage.date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Composant Correction -->
    <Correction
      v-if="selectedPassage"
      :username="username"
      :idQuestionnaire="selectedPassage.id_questionnaire"
      :idUtilisateur="selectedPassage.id_utilisateur"
      @goBack="selectedPassage = null"
    />
    <router-view></router-view>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';
import Correction from './Correction.vue';

const router = useRouter();
const passages = ref([]);
const filteredPassages = ref([]);
const selectedPassage = ref(null);
const utilisateurs = ref({});
const questionnaires = ref({});
const username = ref('');
const searchQuery = ref('');

// Fonction pour récupérer les passages
const fetchPassages = async () => {
  const { data, error } = await supabase
    .from('passer')
    .select(`id_passer, date, note, id_utilisateur, id_questionnaire`)
    .order('date', { ascending: false });

  if (error) {
    console.error("Erreur lors de la récupération des passages :", error);
  } else {
    passages.value = data;
    filteredPassages.value = data;
    fetchUtilisateurs();
  }
};

// Fonction pour récupérer les utilisateurs
const fetchUtilisateurs = async () => {
  const { data, error } = await supabase
    .from('utilisateur')
    .select('id_utilisateur, pseudo');

  if (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
  } else {
    utilisateurs.value = data.reduce((acc, utilisateur) => {
      acc[utilisateur.id_utilisateur] = utilisateur.pseudo;
      return acc;
    }, {});
    console.log("Utilisateurs chargés:", utilisateurs.value);  // Vérification des utilisateurs
    fetchQuestionnaires();
  }
};

// Fonction pour récupérer les questionnaires
const fetchQuestionnaires = async () => {
  const { data, error } = await supabase
    .from('questionnaire')
    .select('id_questionnaire, nom');

  if (error) {
    console.error("Erreur lors de la récupération des questionnaires :", error);
  } else {
    questionnaires.value = data.reduce((acc, questionnaire) => {
      acc[questionnaire.id_questionnaire] = questionnaire.nom;
      return acc;
    }, {});
    console.log("Questionnaires chargés:", questionnaires.value);  // Vérification des questionnaires
    mapPassages();
  }
};

// Fonction pour associer les passages avec les utilisateurs et les questionnaires
const mapPassages = () => {
  passages.value = passages.value.map(passage => {
    const utilisateur = utilisateurs.value[passage.id_utilisateur];
    return {
      ...passage,
      utilisateur: utilisateur || 'Inconnu',  // Assurez-vous que chaque passage a un utilisateur valide
      nom_questionnaire: questionnaires.value[passage.id_questionnaire] || 'Inconnu'  // Gestion d'un questionnaire non trouvé
    };
  });
  filteredPassages.value = passages.value;
  console.log("Passages après mappage:", passages.value);  // Vérification des passages après mappage
};

// Fonction pour afficher la correction du passage
const showCorrection = async (passage) => {
  try {
    const { data, error } = await supabase
      .from('questionnaire')
      .select('id_questionnaire')
      .eq('nom', passage.nom_questionnaire)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération de l'ID du questionnaire :", error);
    } else {
      selectedPassage.value = {
        ...passage,
        id_questionnaire: data.id_questionnaire
      };
      router.push({
        name: 'Correction',
        params: {
          idQuestionnaire: data.id_questionnaire,
          idUtilisateur: passage.id_utilisateur
        }
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ID du questionnaire :", error);
  }
};

// Fonction pour formater la date
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('fr-FR', options);
};

// Fonction pour filtrer les passages en fonction du pseudo des utilisateurs
const filterPassages = () => {
  const query = searchQuery.value.toLowerCase();
  filteredPassages.value = passages.value.filter(passage =>
    passage.utilisateur.toLowerCase().includes(query)
  );
  console.log("Passages filtrés:", filteredPassages.value);  // Vérification des passages après filtrage
};

// Charger les données lors de l'initialisation
onMounted(() => {
  fetchPassages();
});
</script>

<style scoped>
header {
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  padding: 20px;
  text-align: center;
  border-radius: 7px;
}

.search-bar {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 5px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  text-align: left;
  border: 1px solid #ccc;
}

th {
  background-color: #f0f0f0;
}

.table-container {
  max-height: 520px; 
  overflow-y: auto; 
  border: 1px solid #ddd; 
  margin-top: 20px;
}

thead th {
  position: sticky;
  top: 0;
  background-color: #fff;
}
</style>
