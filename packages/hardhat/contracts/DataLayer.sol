//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DataLayer is Ownable {

    uint256[][] public userActivityMatrix;
    mapping(address => uint256) public addressToId;
    mapping(uint256 => address) public idToAddress;
    mapping(address => uint256) public consumerCredits;
    mapping(bytes32 => uint256) public schemaIndex;
    uint256 public latestIndex;
    uint256 public totalCategories;

    enum Category {
        Gaming,
        Marketplace,
        Defi,
        Dao,
        Web3Social,
        Identity,
        Certificates
    }

    struct SchemaDetails {
        bytes32 schemaName;
        bytes32[] columns;
        Category schemaCategory;
        uint256 totalRecords;
    }

    struct Analytics {
        bytes32 schemaName;
        bytes32[] columns;
        Category schemaCategory;
        uint256[][] data;
        mapping(address => uint256) addressToId;
        mapping(uint256 => address) idToAddress;
        mapping(bytes32 => uint256) columnToIndex;
    }

    Analytics[] public dappAnalytics;

    constructor() Ownable() {
        uint256[] memory initialMatrix;
        userActivityMatrix.push(initialMatrix);
        latestIndex = 0;
        totalCategories = 7;
        dappAnalytics.push();
    }

    event NewAnalytics(address user, address provider, uint256 category);

    function addUser(address userAddress) external {
        latestIndex = latestIndex + 1;
        uint256[] memory initialMatrix;
        userActivityMatrix.push(initialMatrix);

        for (uint256 i = 0; i < totalCategories; i++) {
            userActivityMatrix[latestIndex].push(0);
        }

        addressToId[userAddress] = latestIndex;
        idToAddress[latestIndex] = userAddress;
    }

    function addSchema(
        bytes32 schemaName,
        bytes32[] calldata columns,
        Category category
    ) external {
        require(schemaIndex[schemaName] == uint256(0), "SCHEMA NAME EXISTS");

        Analytics storage analytics = dappAnalytics.push();
        analytics.schemaName = schemaName;
        analytics.schemaCategory = category;

        uint256[] memory initialUser;
        analytics.data.push(initialUser);

        for (uint256 i = 0; i < columns.length; i++) {
            analytics.data[0].push(0);
            analytics.columns.push(columns[i]);
            analytics.columnToIndex[columns[i]] = i;
        }

        schemaIndex[schemaName] = dappAnalytics.length - 1;
    }

    function addAnalytics(
        address userAddress,
        bytes32 schemaName,
        bytes32[] calldata columns,
        uint256[] calldata data
    ) public {
        require(schemaIndex[schemaName] != 0, "SCHEMA NOT PRESENT");

        if (addressToId[userAddress] == 0) {
            this.addUser(userAddress);
        }

        Analytics storage schemaAnalytics = dappAnalytics[
            schemaIndex[schemaName]
        ];

        if (schemaAnalytics.addressToId[userAddress] == 0) {
            schemaAnalytics.data.push();
            for (uint256 i = 0; i < schemaAnalytics.columns.length; i++) {
                schemaAnalytics.data[schemaAnalytics.data.length - 1].push(0);
            }

            schemaAnalytics.addressToId[userAddress] =
                schemaAnalytics.data.length - 1;
            schemaAnalytics.idToAddress[
                schemaAnalytics.data.length - 1
            ] = userAddress;
        }

        for (uint256 i = 0; i < columns.length; i++) {
            schemaAnalytics.data[schemaAnalytics.addressToId[userAddress]][
                schemaAnalytics.columnToIndex[columns[i]]
            ] += data[i];
        }

        userActivityMatrix[addressToId[userAddress]][
            uint256(schemaAnalytics.schemaCategory)
        ] += 1;

        consumerCredits[msg.sender] = consumerCredits[msg.sender] + 1;

        emit NewAnalytics(
            userAddress,
            msg.sender,
            uint256(schemaAnalytics.schemaCategory)
        );
    }

    function updateAnalytics(
        address userAddress,
        bytes32 schemaName,
        bytes32[] calldata columns,
        uint256[] calldata data
    ) public {
        if (addressToId[userAddress] == 0) {
            this.addUser(userAddress);
        }

        Analytics storage schemaAnalytics = dappAnalytics[
            schemaIndex[schemaName]
        ];

        if (schemaAnalytics.addressToId[userAddress] == 0) {
            schemaAnalytics.data.push();
            for (uint256 i = 0; i < schemaAnalytics.columns.length; i++) {
                schemaAnalytics.data[schemaAnalytics.data.length - 1].push(0);
            }

            schemaAnalytics.addressToId[userAddress] =
                schemaAnalytics.data.length - 1;
            schemaAnalytics.idToAddress[
                schemaAnalytics.data.length - 1
            ] = userAddress;
        }

        for (uint256 i = 0; i < columns.length; i++) {
            schemaAnalytics.data[schemaAnalytics.addressToId[userAddress]][
                schemaAnalytics.columnToIndex[columns[i]]
            ] = data[i];
        }

        userActivityMatrix[addressToId[userAddress]][
            uint256(schemaAnalytics.schemaCategory)
        ] += 1;

        consumerCredits[msg.sender] = consumerCredits[msg.sender] + 1;

        emit NewAnalytics(
            userAddress,
            msg.sender,
            uint256(schemaAnalytics.schemaCategory)
        );
    }

    function getUserActivityMatrix()
        external
        view
        returns (uint256[][] memory)
    {
        return userActivityMatrix;
    }

    function getAllSchemas() external view returns (SchemaDetails[] memory) {
        SchemaDetails[] memory schemaDetails = new SchemaDetails[](dappAnalytics.length - 1);
        for (uint256 i = 1; i < dappAnalytics.length; i++) {
            SchemaDetails memory schemaDetail;
            schemaDetail.schemaName = dappAnalytics[i].schemaName;
            schemaDetail.columns = dappAnalytics[i].columns;
            schemaDetail.schemaCategory = dappAnalytics[i].schemaCategory;
            schemaDetail.totalRecords = dappAnalytics[i].data.length;
            schemaDetails[i - 1] = schemaDetail;
        }

        return schemaDetails;
    }

    function getAnalyticsDataBySchemaName(
        bytes32 schemaName
    ) external view returns (uint256[][] memory) {
        return dappAnalytics[schemaIndex[schemaName]].data;
    }

    function getColumnsOfSchema(
        bytes32 schemaName
    ) external view returns (bytes32[] memory) {
        return dappAnalytics[schemaIndex[schemaName]].columns;
    }

    function getSchemaAddressToId(
        bytes32 schemaName,
        address userAddress
    ) external view returns (uint256) {
        return dappAnalytics[schemaIndex[schemaName]].addressToId[userAddress];
    }

    function getSchemaIdToAddress(
        bytes32 schemaName,
        uint256 userId
    ) external view returns (address) {
        return dappAnalytics[schemaIndex[schemaName]].idToAddress[userId];
    }

}
