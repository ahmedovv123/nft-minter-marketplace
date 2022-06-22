//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract SwapPool is ERC20 {

    address public token0;
    address public token1;

    uint256 public reserve0;
    uint256 public reserve1;

    uint256 public constant INITIAL_SUPPLY = 1000 * 10**18;

    constructor(address _token0, address _token1) ERC20("SwapPoolToken", "SPT") {
        token0 = _token0;
        token1 = _token1;
    }

    function add(uint256 amount0, uint256 amount1) public {
        IERC20(token0).transferFrom(msg.sender, address(this), amount0);
        IERC20(token1).transferFrom(msg.sender, address(this), amount1);

        uint256 newReserve0 = reserve0 + amount0;
        uint256 newReserve1 = reserve1 + amount1;

        if (reserve0 == 0 && reserve1 == 0) {
            _mint(msg.sender, INITIAL_SUPPLY);
        } else {
            uint256 currentSupply = totalSupply();
            uint256 newSupplyForReserve0 = (newReserve0 * currentSupply) / reserve0;
            uint256 newSupplyForReserve1 = (newReserve1 * currentSupply) / reserve1;
            uint256 newSupply = Math.min(newSupplyForReserve0, newSupplyForReserve1);

            _mint(msg.sender, newSupply - currentSupply);
        }

        reserve0 = newReserve0;
        reserve1 = newReserve1;
    }

    function remove(uint256 liquidity) public {
        IERC20(address(this)).transferFrom(msg.sender, address(this), liquidity);

        uint256 currentSupply = totalSupply();

        uint256 amount0 = (liquidity * reserve0) / currentSupply;
        uint256 amount1 = (liquidity * reserve1) / currentSupply;

        _burn(address(this), liquidity);

        IERC20(token0).transfer(msg.sender, amount0);
        IERC20(token1).transfer(msg.sender, amount1);

        reserve0 = reserve0 - amount0;
        reserve1 = reserve1 - amount1;
    }

    function getAmountOut(uint256 amountIn, address fromToken) public view returns(uint256, uint256, uint256) {
        uint256 newReserve0;
        uint256 newReserve1;
        uint256 amountOut;
        uint256 k = reserve0 * reserve1;

        if (fromToken == token0) {
            newReserve0 = amountIn + reserve0;
            newReserve1 = k / newReserve0;
            amountOut = reserve1 - newReserve1;
        } else {
            newReserve1 = amountIn + reserve1;
            newReserve0 = k / newReserve1;
            amountOut = reserve0 - newReserve0;
        }

        return (amountOut, newReserve0, newReserve1);
    }

    function swap(uint256 amountIn, uint256 minAmountOut, address fromToken, address toToken, address to) public {
        require(amountIn > 0 && minAmountOut > 0, "Invalid amounts");
        require(fromToken == token0 || fromToken == token1, "from token invalid");
        require(toToken == token0 || toToken == token1, "to token invalid");
        require(fromToken != toToken, "can't be the same");

        (uint256 amountOut, uint256 newReserve0, uint256 newReserve1) = getAmountOut(amountIn, fromToken);

        require(amountOut >= minAmountOut, "slippage too high");
        IERC20(fromToken).transferFrom(msg.sender, address(this), amountIn);
        IERC20(toToken).transfer(to, amountOut);

        reserve0 = newReserve0;
        reserve1 = newReserve1;
    }
}