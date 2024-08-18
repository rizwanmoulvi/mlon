//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./DataLayer.sol";

contract LinearRegression {
	DataLayer dataLayer;

	int256 constant FIXED_POINT = 1e9; // Scaling factor for fixed-point arithmetic

	constructor(DataLayer _dataLayer) {
		dataLayer = _dataLayer;
	}

  // Get linear regression for onchain schema data
	function getLinearRegression(
		bytes32 schemaName,
    uint256[] memory trainingColIndices,
		uint256 labelColIndex,
    int256[][] memory testData,
		int256 learningRate,
		uint256 iterations,
		int256 bias
	) public view returns (int256[] memory) {
		uint256[][] memory analyticsData = dataLayer
			.getAnalyticsDataBySchemaName(schemaName);

    int256[][] memory trainingData = new int256[][](analyticsData.length);

		int256[] memory labels = new int256[](analyticsData.length);

		for (uint256 i = 1; i < analyticsData.length; i++) {
      trainingData[i] = new int256[](trainingColIndices.length);
			labels[i] = int256(analyticsData[i][labelColIndex]) * FIXED_POINT;

      for (uint256 j = 0; j < trainingColIndices.length; j++) {
        trainingData[i][j] = int256(analyticsData[i][trainingColIndices[j]]) * FIXED_POINT;
      }
		}

		int256[] memory weights = fit(
			trainingData,
			labels,
			learningRate,
			iterations,
			bias
		);

		int256[] memory predictions = predict(testData, bias, weights);

		return predictions;
	}

  // Get linear regression for offchain data
  function getLinearRegressionOffChainData(
		int256[][] memory analyticsData,
		int256[] memory labels,
		int256[][] memory testData,
		int256 learningRate,
		uint256 iterations,
		int256 bias
	) public pure returns (int256[] memory) {
		

		int256[] memory weights = fit(
			analyticsData,
			labels,
			learningRate,
			iterations,
			bias
		);

		int256[] memory predictions = predict(testData, bias, weights);

		return predictions;
	}


	/**
	 * Fits the linear regression model to the training data
	 * @param X - The training features.
	 * @param y - The training labels.
	 */
	function fit(
		int256[][] memory X,
		int256[] memory y,
		int256 learningRate,
		uint256 iterations,
		int256 bias
	) public pure returns (int256[] memory) {
		require(
			X.length == y.length,
			"Feature and label arrays must have the same length."
		);

		// Initialize weights
		int256[] memory weights = new int256[](X[0].length);
  
		for (uint256 iter = 0; iter < iterations; iter++) {
			int256[] memory predictions = new int256[](X.length);
			int256[] memory dw = new int256[](X[0].length);
			int256 db = 0;

			// Compute predictions
			for (uint256 i = 1; i < X.length; i++) {
				int256 linearModel = bias;
				for (uint256 j = 0; j < X[0].length; j++) {
					linearModel += (weights[j] * X[i][j]) / FIXED_POINT;
				}
				predictions[i] = linearModel;
			}

			// Compute gradients
			for (uint256 i = 1; i < X.length; i++) {
				int256 error = predictions[i] - y[i];
				for (uint256 j = 0; j < X[0].length; j++) {
					dw[j] += (X[i][j] * error) / (int256(X.length) * FIXED_POINT);
				}
        
				db += error / int256(X.length);
			}

			// Update weights and bias
			for (uint256 j = 0; j < X[0].length; j++) {
				weights[j] -= (learningRate * dw[j]) / FIXED_POINT;
			}
			bias -= (learningRate * db) / FIXED_POINT;
		}

		return weights;
	}

	/**
	 * Predicts the labels for the given input data
	 * @param X - The input features.
	 */
	function predict(
		int256[][] memory X,
		int256 bias,
		int256[] memory weights
	) public pure returns (int256[] memory) {
		uint256 m = X.length;
		int256[] memory predictions = new int256[](m);

		for (uint256 i = 0; i < m; i++) {
			int256 linearModel = bias;
			for (uint256 j = 0; j < X[0].length; j++) {
				linearModel += (weights[j] * X[i][j]) / FIXED_POINT;
			}
			predictions[i] = linearModel;
		}

		return predictions;
	}
}
