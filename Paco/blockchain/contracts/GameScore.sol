// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GameScore {
    uint256 private score;

    function setScore(uint256 _score) public {
        score = _score;
    }

    function getScore() public view returns (uint256) {
        return score;
    }
}
