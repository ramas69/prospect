# 🚀 HALL PROSPECTS - Plateforme de Prospection Intelligente

Une plateforme complète et moderne de génération de leads automatique depuis Google Maps, avec analytics avancés, gamification et suivi en temps réel.

![Version](https://img.shields.io/badge/version-2.0.0-orange)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Ready-green)

## ✨ Fonctionnalités Principales

### 🎯 Scraping Intelligent
- **Extraction automatique** de leads depuis Google Maps
- **Recherche d'emails** automatique pour chaque lead
- **Suivi en temps réel** avec barre de progression détaillée
- **Étapes visualisées** : Connexion → Extraction → Emails → Export
- **Export automatique** vers Google Sheets
- **Notifications** par email à la fin du scraping

### 📊 Dashboard & Analytics
- **Vue d'ensemble** avec métriques clés (scraping, leads, emails, streak)
- **Graphiques de performance** : taux de succès, moyennes, tendances
- **Analytics quotidiens** avec historique complet
- **Métriques avancées** : leads par scraping, emails trouvés, durée moyenne
- **Filtres temporels** : 7 jours, 30 jours, 1 an
- **Export CSV/Excel** de toutes les données

### 📜 Historique & Recherche
- **Historique complet** de tous les scraping
- **Recherche avancée** par secteur, location, statut
- **Filtres multiples** pour affiner les résultats
- **Détails complets** : leads générés, emails trouvés, durée
- **Accès direct** aux Google Sheets générés
- **Export massif** en CSV

### 🎨 Templates & Favoris
- **Création de templates** pour sauvegarder vos recherches
- **Système de favoris** pour accès rapide
- **Compteur d'utilisation** pour suivre vos templates les plus utilisés
- **Suggestions intelligentes** basées sur l'historique
- **Modification et suppression** facilitées

### 🏆 Gamification & Badges
- **10+ badges** à débloquer :
  - 🚀 Premier Pas (1er scraping)
  - 🎯 Prospecteur (10 scraping)
  - 👑 Expert (50 scraping)
  - 🏅 Maître (100 scraping)
  - 👥 Collectionneur (100 leads)
  - 🎖️ Chasseur (500 leads)
  - 🏆 Légende (1000 leads)
  - 🔥 Régularité (7 jours consécutifs)
  - ⚡ Détermination (30 jours consécutifs)
  - 📧 Email Hunter (100 emails)
- **Système de streak** pour encourager la régularité
- **Progression visuelle** pour chaque badge
- **Catégories** : Jalons, Réussites, Streaks

### ⚙️ Paramètres & Personnalisation
- **Profil utilisateur** éditable
- **Thème clair/sombre/système** avec switch en temps réel
- **Notifications configurables** (push + email)
- **Rapports hebdomadaires** par email
- **Limite par défaut** personnalisable
- **Tutoriel interactif** réactivable

### 🎓 Tutoriel Interactif
- **Guide de démarrage** en 5 étapes
- **Animations fluides** et transitions élégantes
- **Skip possible** à tout moment
- **Réactivable** depuis les paramètres
- **Apparition automatique** pour les nouveaux utilisateurs

### 🔐 Authentification & Sécurité
- **Authentification Supabase** (email/password)
- **Gestion de session** automatique
- **Row Level Security (RLS)** sur toutes les tables
- **Politique de sécurité stricte** : chaque utilisateur ne voit que ses données
- **Profil utilisateur** automatiquement créé à l'inscription

### 🎨 Design & UX
- **Interface moderne** avec Tailwind CSS
- **Mode sombre** complet
- **Responsive** : Mobile, Tablette, Desktop
- **Animations fluides** avec transitions CSS
- **Feedback visuel** : toasts, loaders, états
- **Particules animées** lors des succès
- **Gradients dynamiques** selon le contexte
- **Icônes Lucide React** pour cohérence visuelle

### 🔔 Notifications Toast
- **Système de notifications** élégant
- **4 types** : success, error, warning, info
- **Auto-dismiss** configurable
- **Fermeture manuelle** possible
- **Stack de notifications** en haut à droite
- **Animations d'entrée/sortie** fluides

## 🏗️ Architecture Technique

### Frontend
- **React 18.3** avec hooks modernes
- **TypeScript 5.5** pour la sécurité des types
- **Vite** pour build ultra-rapide
- **Tailwind CSS** pour le styling
- **Context API** pour la gestion d'état globale

### Backend & Base de données
- **Supabase** (PostgreSQL)
- **8 tables** relationnelles :
  - `profiles` : Profils utilisateurs
  - `scraping_sessions` : Historique des scraping
  - `scraping_results` : Résultats détaillés
  - `templates` : Templates sauvegardés
  - `badges` : Définition des badges
  - `user_badges` : Badges gagnés
  - `analytics_daily` : Statistiques quotidiennes
  - `user_settings` : Préférences utilisateur
- **RLS (Row Level Security)** activé partout
- **Policies restrictives** par défaut
- **Real-time subscriptions** pour suivi en temps réel

### Intégration
- **n8n webhook** pour l'automatisation
- **Google Sheets API** pour l'export
- **Google Maps** scraping via n8n

## 📦 Installation

### Prérequis
- Node.js 18+ et npm
- Compte Supabase (gratuit)
- n8n instance (optionnel pour mode démo)

### Étapes

1. **Cloner et installer**
```bash
git clone <repository>
cd hall-prospects
npm install
```

2. **Configurer Supabase**

Créez un projet sur [Supabase](https://supabase.com) et récupérez :
- Project URL
- Anon Key

Les migrations de base de données sont déjà incluses dans le code et seront automatiquement appliquées.

3. **Configurer les variables d'environnement**

Copiez `.env.example` vers `.env` et remplissez :

```env
# Supabase (REQUIS)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key

# n8n Webhook (optionnel - mode démo si non configuré)
VITE_N8N_WEBHOOK_URL=https://votre-n8n.com/webhook/scraping

# Google Maps (optionnel)
VITE_GOOGLE_MAPS_API_KEY=votre_api_key
```

4. **Lancer l'application**

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview production
npm run preview
```

## 🔧 Configuration n8n (optionnel)

Si vous voulez connecter un vrai système de scraping via n8n :

### Webhook Input
```json
{
  "session_id": "uuid",
  "lien_google_maps": "url",
  "secteur_activite": "string",
  "limit_resultats": 10,
  "email_notification": "email@example.com",
  "nouveau_fichier": true,
  "nom_fichier": "string",
  "nom_feuille": "string"
}
```

### Webhook Output
```json
{
  "nom_feuille_google_sheet": "test_234",
  "lien_google_sheet": "https://docs.google.com/spreadsheets/d/...",
  "statut": "terminé"
}
```

### Mise à jour temps réel
Le n8n workflow devrait mettre à jour la table `scraping_sessions` :
```sql
UPDATE scraping_sessions
SET
  status = 'in_progress',
  progress_percentage = 40,
  current_step = 'Extraction des données'
WHERE id = 'session_id';
```

## 📱 Mode Démo

Sans configuration n8n, l'application fonctionne en **mode démo** :
- ✅ Toutes les fonctionnalités du dashboard
- ✅ Simulation de scraping avec progression
- ✅ Création de données mockées
- ✅ Parfait pour tester l'interface

## 🎯 Utilisation

### 1. Créer un compte
- Inscription avec email/password
- Profil automatiquement créé
- Settings par défaut appliqués

### 2. Premier scraping
- Aller sur "Nouveau Scraping"
- Coller un lien Google Maps
- Définir secteur et limite
- Lancer le scraping
- Suivre la progression en temps réel

### 3. Consulter les résultats
- Dashboard : vue d'ensemble
- Historique : tous les scraping
- Analytics : graphiques et stats
- Export : CSV/Excel

### 4. Débloquer des badges
- Faire des scraping régulièrement
- Atteindre les objectifs
- Maintenir un streak
- Collectionner les badges

### 5. Créer des templates
- Sauvegarder vos recherches fréquentes
- Marquer comme favoris
- Réutiliser en un clic

## 🎨 Personnalisation

### Thèmes
- **Clair** : Design épuré et professionnel
- **Sombre** : Confortable pour les yeux
- **Système** : Suit les préférences OS

### Notifications
- **Push** : Dans le navigateur
- **Email** : Rapports hebdomadaires
- **Toasts** : Feedback immédiat

### Préférences
- Limite par défaut
- Affichage du tutoriel
- Reports automatiques

## 📊 Métriques & KPIs

L'application track automatiquement :
- 📈 Nombre total de scraping
- 👥 Leads générés
- 📧 Emails trouvés
- 🔥 Streak actuel et record
- ⏱️ Durée moyenne par scraping
- 📊 Taux de succès email
- 📅 Analytics quotidiens

## 🔒 Sécurité

### Row Level Security
Toutes les tables sont protégées :
```sql
-- Exemple de policy
CREATE POLICY "Users can view own sessions"
  ON scraping_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### Authentification
- Supabase Auth (industrie standard)
- Tokens JWT sécurisés
- Sessions persistantes
- Pas de stockage de mots de passe en clair

### Données
- Isolation complète par utilisateur
- Aucun accès cross-user
- Policies restrictives par défaut
- Audit trail via timestamps

## 🚀 Performance

- **Build optimisé** : ~1MB gzippé
- **Lazy loading** : Components à la demande
- **Caching** : Supabase client cache
- **Real-time** : WebSocket pour updates
- **Responsive** : 60fps animations

## 🤝 Support & Contribution

Pour toute question :
1. Vérifier la documentation
2. Consulter les logs console
3. Vérifier la config Supabase
4. Tester en mode démo

## 📝 Licence

Tous droits réservés - HALL PROSPECTS © 2025

## 🎉 Crédits

Développé avec ❤️ en utilisant :
- React
- TypeScript
- Tailwind CSS
- Supabase
- Lucide Icons
- Vite

---

**HALL PROSPECTS** - Intelligence Concurrentielle
