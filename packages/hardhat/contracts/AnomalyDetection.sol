//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./DataLayer.sol";

contract AnomalyDetection {
	DataLayer dataLayer;

	constructor(DataLayer _dataLayer) {
		dataLayer = _dataLayer;
	}

  // Get anomaly detection for any schema data
  function getAnomalyDetection(bytes32 schemaName, uint256 threshold) public view returns(uint256[][] memory) {
    uint256[][] memory analyticsData = dataLayer.getAnalyticsDataBySchemaName(schemaName);

    uint256[] memory means = calculateMean(analyticsData);

    uint256[] memory stdDevs = calculateStdDev(analyticsData, means);

    uint256[][] memory predictions = detectAnomalies(analyticsData, means, stdDevs, threshold);

    return predictions;
  }

  // Get anomaly detection for any offchain data
  function getAnomalyDetectionOffChainData(uint256[][] memory analyticsData, uint256 threshold) public pure returns(uint256[][] memory) {

    uint256[] memory means = calculateMean(analyticsData);

    uint256[] memory stdDevs = calculateStdDev(analyticsData, means);

    uint256[][] memory predictions = detectAnomalies(analyticsData, means, stdDevs, threshold);

    return predictions;
  }


  function detectAnomalies(
		uint256[][] memory data,
		uint256[] memory means,
		uint256[] memory stddevs,
		uint256 threshold
	) internal pure returns (uint256[][] memory) {
		uint256[] memory anomalies = new uint256[](data.length);
		uint256 numColumns = data[1].length;

		uint256 idx = 0;
		for (uint i = 1; i < data.length; i++) {
			if (isAnomalous(numColumns, data[i], means, stddevs, threshold)) {
				anomalies[idx] = i;
				idx += 1;
			}
		}

    uint256[][] memory anomalousRows = new uint256[][](idx);
    for (uint256 i = 0; i < idx; i++) {
      anomalousRows[i] = data[anomalies[i]];
    }
		
    return anomalousRows;
	}

	function isAnomalous(
		uint256 numColumns,
		uint256[] memory values,
		uint256[] memory means,
		uint256[] memory stddevs,
		uint256 threshold
	) internal pure returns (bool) {
		require(values.length == numColumns, "Incorrect number of columns");
		for (uint j = 0; j < numColumns; j++) {
			uint diff = values[j] > means[j]
				? values[j] - means[j]
				: means[j] - values[j];
			if (diff * 100 > (threshold * stddevs[j])) {
				return true;
			}
		}
		return false;
	}

	

	/**
	 * @dev Calculate mean of a matrix
	 */
	function calculateMean(
		uint256[][] memory data
	) internal pure returns (uint256[] memory) {
		uint256 numColumns = data[1].length;
		uint256[] memory sums = new uint256[](numColumns);
		for (uint i = 0; i < data.length; i++) {
			for (uint j = 0; j < numColumns; j++) {
				sums[j] += data[i][j];
			}
		}

		uint256[] memory means = new uint256[](numColumns);
		for (uint j = 0; j < numColumns; j++) {
			means[j] = sums[j] / data.length;
		}

		return means;
	}

	/**
	 * @dev Calculate standard deviation of a matrix
	 */
	function calculateStdDev(
		uint256[][] memory data,
		uint256[] memory means
	) internal pure returns (uint256[] memory) {
		uint256 numColumns = data[1].length;
		uint[] memory sumSquares = new uint[](numColumns);

		for (uint i = 0; i < data.length; i++) {
			for (uint j = 0; j < numColumns; j++) {
				uint diff = data[i][j] > means[j]
					? data[i][j] - means[j]
					: means[j] - data[i][j];
				sumSquares[j] += diff * diff;
			}
		}

		uint256[] memory stddevs = new uint256[](numColumns);
		for (uint j = 0; j < numColumns; j++) {
			stddevs[j] = sqrt(sumSquares[j] / data.length);
		}

		return stddevs;
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
}
