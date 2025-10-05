/**
 * Calculates the Cosine Similarity between two vectors (posts).
 * In Item-Based CF, the vectors represent the 'ratings' (likes) given
 * to two different posts by the entire user base.
 * @param {number[]} vectorA - The interaction vector (e.g., [1, 0, 1]) for Post A.
 * @param {number[]} vectorB - The interaction vector (e.g., [1, 1, 0]) for Post B.
 * @returns {number} The cosine similarity score (-1 to 1).
 */
export function calculateCosineSimilarity(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Builds the Interaction Matrix from posts data.
 * @param {Array} allPosts - Array of all post objects from Firestore.
 * @param {Array} allUsers - Array of all user objects from Firestore (for user IDs).
 * @returns {Object} A nested object where matrix[postId][userId] = 1 (if liked) or 0.
 */
export function buildInteractionMatrix(allPosts, allUsers) {
  const interactionMatrix = {};
  const allUserIds = allUsers.map(u => u.id);

  allPosts.forEach(post => {
    interactionMatrix[post.id] = {};
    const likedByUids = post.likes || []; 

    allUserIds.forEach(userId => {
      interactionMatrix[post.id][userId] = likedByUids.includes(userId) ? 1 : 0;
    });
  });
  return interactionMatrix;
}

/**
 * Generates recommendations for a target user (targetUserId)
 * based on the posts they have liked (history).
 * @param {object} interactionMatrix - { postId: { userId: rating, ... }, ... }
 * @param {string} targetUserId - The ID of the user to generate recommendations for.
 * @param {string[]} likedPostIds - List of post IDs the target user has liked.
 * @returns {string[]} A list of recommended Post IDs (top 10).
 */
export function generateItemBasedRecommendations(interactionMatrix, targetUserId, likedPostIds, selfAuthoredPostIds) {
  const allPostIds = Object.keys(interactionMatrix);
  const similarityScores = {};
  const predictionScores = {};

  for (let i = 0; i < allPostIds.length; i++) {
    const postAId = allPostIds[i];
    const postAUsers = interactionMatrix[postAId];

    for (let j = i + 1; j < allPostIds.length; j++) {
      const postBId = allPostIds[j];
      const postBUsers = interactionMatrix[postBId];

      const allUsers = new Set([...Object.keys(postAUsers), ...Object.keys(postBUsers)]);
      const vectorA = [];
      const vectorB = [];

      allUsers.forEach(userId => {
        vectorA.push(postAUsers[userId] || 0); 
        vectorB.push(postBUsers[userId] || 0);
      });
      
      const similarity = calculateCosineSimilarity(vectorA, vectorB);
      const simKey = postAId > postBId
        ? `${postAId}_${postBId}`
        : `${postBId}_${postAId}`;

      similarityScores[simKey] = similarity;
    }
  }

  allPostIds.filter(postId => 
      !likedPostIds.includes(postId) && 
      !selfAuthoredPostIds.includes(postId) && 
      interactionMatrix[postId]
  )
    .forEach(unseenPostId => {
      let numerator = 0;
      let denominator = 0;
      likedPostIds.forEach(likedPostId => {
        const simKey = unseenPostId > likedPostId
          ? `${unseenPostId}_${likedPostId}`
          : `${likedPostId}_${unseenPostId}`;
    
        const similarity = similarityScores[simKey] || 0;
        const userRating = interactionMatrix[likedPostId][targetUserId] || 0; 

        numerator += similarity * userRating;
        denominator += Math.abs(similarity);
      });

      if (denominator !== 0) {
        predictionScores[unseenPostId] = numerator / denominator;
      } else {
        predictionScores[unseenPostId] = 0;
      }
    });
  const sortedRecommendations = Object.entries(predictionScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([postId]) => postId);

  return sortedRecommendations.slice(0, 5);
}