//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./DataLayer.sol";

contract KNN {

  DataLayer dataLayer;
  uint256[][] public userActivityMatrix;
  uint256 public totalCategories;

  enum Distance {
		Euclidean,
    Cosine
	}

  struct similarityPair {
		uint256 index;
		uint256 similarity;
	}

  constructor(DataLayer _dataLayer) {
    dataLayer = _dataLayer;
    userActivityMatrix = dataLayer.getUserActivityMatrix();
    totalCategories = dataLayer.totalCategories();
  }

  // Get KNN of any schema row
  function getKNN(bytes32 schemaName, uint256[] memory row, uint64 k, Distance distance) external view returns(uint256[][] memory) {
    uint256[][] memory analyticsData = dataLayer.getAnalyticsDataBySchemaName(schemaName);

    uint256[] memory similarityArray = computeSimilarityArray(analyticsData, row, distance);

    uint256[][] memory predictions = getKNN(similarityArray, analyticsData, k);

    return predictions;
  }

  // Get KNN of offchain data
  function getKNNOffChainData(uint256[][] memory analyticsData, uint256[] memory row, uint64 k, Distance distance) external pure returns(uint256[][] memory) {

    uint256[] memory similarityArray = computeSimilarityArray(analyticsData, row, distance);

    uint256[][] memory predictions = getKNN(similarityArray, analyticsData, k);

    return predictions;
  }

  function getRecommendedSimilarUsers(
		address userAddress,
		uint64 k
	) external view returns (address[][] memory) {
		uint256[][] memory similarityMatrix = computeUserSimilarityMatrix();

		address[][] memory recommendedFollowers = recommend(
			dataLayer.addressToId(userAddress),
			similarityMatrix,
			k
		);

		return recommendedFollowers;
	}

  // Function to compute similarity matrix
	function computeSimilarityArray(uint256[][] memory inputData, uint256[] memory test_row, Distance distance)
		internal
		pure
		returns (uint256[] memory)
	{
		uint256 numRows = inputData.length;
		uint256[] memory similarityMatrix = new uint256[](numRows);

		// similarityMatrix.push();
		for (uint256 i = 1; i < numRows; i++) {
			uint256[] memory row = inputData[i];
      if (distance == Distance.Cosine) {
        similarityMatrix[i] = cosineDistance(row, test_row);
      } else {
        similarityMatrix[i] = euclideanDistance(row, test_row);
      }
      
		}

		return similarityMatrix;
	}


	// Function to compute user-user similarity matrix
	function computeUserSimilarityMatrix()
		internal
		view
		returns (uint256[][] memory)
	{
		uint256 numUsers = userActivityMatrix.length;
		uint256[][] memory similarityMatrix = new uint256[][](numUsers);

		// similarityMatrix.push();
		for (uint256 i = 1; i < numUsers; i++) {
			uint256[] memory row = new uint256[](numUsers);
			similarityMatrix[i] = row;

			for (uint64 j = 1; j < numUsers; j++) {
				uint256[] memory user1 = userActivityMatrix[i];
				uint256[] memory user2 = userActivityMatrix[j];
				similarityMatrix[i][j] = cosineDistance(user1, user2);
			}
		}

		return similarityMatrix;
	}

  // Function to recommend similar users for a given user
	function getKNN(
		uint256[] memory similarityArray,
    uint256[][] memory inputData,
		uint64 k
	) internal pure returns (uint256[][] memory) {
		similarityPair[] memory similarRows = new similarityPair[](
			similarityArray.length - 1
		);
		uint256 idx = 0;

		// Find k most similar users to the target user
		for (uint256 j = 1; j < similarityArray.length; j++) {	
			similarityPair memory row;
			row.index = j;
			row.similarity = similarityArray[j];
			similarRows[idx] = row;
			idx += 1;
		}

		// Sort similar users by descending similarity
		similarRows = bubbleSort(similarRows);

		// Recommend followers from the top k similar users
		uint256[][] memory recommendations = new uint256[][](
			k
		);
		for (uint64 i = 0; i < k; i++) {
      uint256[] memory row = new uint256[](inputData[similarRows[i].index].length);
      recommendations[i] = row;
      for (uint256 j = 0; j < inputData[similarRows[i].index].length; j++) {
        recommendations[i][j] = inputData[similarRows[i].index][j];
      }
		}

		return recommendations;
	}


	// Function to recommend similar users for a given user
	function recommend(
		uint256 userIndex,
		uint256[][] memory similarityMatrix,
		uint64 k
	) public view returns (address[][] memory) {
		similarityPair[] memory similarUsers = new similarityPair[](
			similarityMatrix[userIndex].length - 1
		);
		uint256 idx = 0;

		// Find k most similar users to the target user
		for (uint256 j = 1; j < similarityMatrix[userIndex].length; j++) {
			if (j != userIndex) {
				similarityPair memory row;
				row.index = j;
				row.similarity = similarityMatrix[userIndex][j];
				similarUsers[idx] = row;
				idx += 1;
			}
		}

		// Sort similar users by descending similarity
		similarUsers = bubbleSort(similarUsers);

		// Recommend followers from the top k similar users
		address[][] memory recommendedFollowers = new address[][](
			totalCategories
		);
		for (uint64 i = 0; i < k; i++) {
			uint64 _idx = 0;
			for (uint256 j = 0; j < totalCategories; j++) {
				address[] memory followerRow = new address[](k);
				recommendedFollowers[j] = followerRow;
				if (userActivityMatrix[similarUsers[i].index][j] > 0) {
					recommendedFollowers[j][_idx] = dataLayer.idToAddress(
						similarUsers[i].index
					);
					_idx = _idx + 1;
				}
			}
		}

		return recommendedFollowers;
	}

  /**
   * @dev Function to calculate cosine distance between two rows
   */
	function cosineDistance(
		uint256[] memory row1,
		uint256[] memory row2
	) internal pure returns (uint256) {
		uint256 dotProduct = dot(row1, row2);
		uint256 normRow1 = sqrt(dot(row1, row1));
		uint256 normRow2 = sqrt(dot(row2, row2));
		return ((dotProduct * 10000) / (normRow1 * normRow2));
	}

  /**
   * 
   * @dev Function to calculate euclidean distance between two rows
   */
  function euclideanDistance(
    uint256[] memory row1,
    uint256[] memory row2
  ) internal pure returns (uint256) {
    uint256 sum = 0;
    for (uint256 i = 0; i < row1.length; i++) {
      if(row1[i] > row2[i]) {
        sum += (row1[i] - row2[i])**2;
      } else {
        sum += (row2[i] - row1[i])**2;
      }
      
    }

    return sqrt(sum);
  } 

  
	/**
	 * @dev Bubble sort.
	 */
	function bubbleSort(
		similarityPair[] memory similarUsers
	) internal pure returns (similarityPair[] memory) {
		uint256 n = similarUsers.length;
		for (uint256 i = 0; i < n - 1; i++) {
			for (uint256 j = 0; j < n - i - 1; j++) {
				if (
					similarUsers[j].similarity > similarUsers[j + 1].similarity
				) {
					(similarUsers[j], similarUsers[j + 1]) = (
						similarUsers[j + 1],
						similarUsers[j]
					);
				}
			}
		}
		return similarUsers;
	}

	/**
	 * @dev Returns the square root of a number.
	 */
	function sqrt(uint256 x) internal pure returns (uint256) {
		uint256 z = (x + 1) / 2;
		uint256 y = x;
		while (z < y) {
			y = z;
			z = ((x / z) + z) / 2;
		}
		return y;
	}

	/**
	 * @dev Returns the dot product of two vectors.
	 */
	function dot(
		uint256[] memory x,
		uint256[] memory y
	) internal pure returns (uint256) {
		require(x.length == y.length);

		uint256 output;
		for (uint256 i = 0; i < x.length; i++) {
			output = (x[i] * y[i]) + output;
		}

		return output;
	}
}