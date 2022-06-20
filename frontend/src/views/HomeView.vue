<script setup>
import { useRouter } from "vue-router";
const router = useRouter();

function goToMint() {
  router.push('/mint')
}

function goToStore() {
  router.push('/nfts')
}

</script>

<template>
<div class="main">
		<div class="heading">
				<h1 class="head animate__animated animate__bounceInLeft"><span>WELCOME TO OUR</span> MARKETPLACE</h1>
				<h3 class="sub animate__animated animate__bounceInRight"><span>MINT A FRESH NFT OR SELL YOURS</span></h3>	
				<div class="btns">
					<a @click="goToMint" class="btn1 animate__animated animate__bounceInRight" href="#">MINT</a>
					<a @click="goToStore" class="btn2 animate__animated animate__bounceInLeft" href="#">STORE</a>
				</div>	
		</div>
	</div>	
</template>

<style scoped>

.main .heading{
	position: absolute;
	height:auto;
	width:100%;
	top:40%;
	transform: translateY(-50%);
	text-align: center;
	text-shadow:0px 0.5px 5px rgba(0, 0, 0, 0.2);
}
.main .heading .head{
	position: relative;
	font-family: 'RacingSansOne',sans-serif;
	font-size:48px;
	font-weight: 600; 
	color:#fff;
}
.main .heading .head span{
	color:#017fb5;
}

.sub span {
  color:#017fb5;
}
.main .heading  .sub{
	position: relative;
	font-family: 'cinzel',sans-serif;
	font-size:22px;
	font-weight: 300; 
	color:#fff;
	margin:-2% 0 2% 0;
}
.main .heading .btns{
	height:auto;
	width:100%;
	display: flex;
	text-align: center;
	align-items: center;
	justify-content: center;
	position: relative;
}
.main .heading .btns a{
	color:#fff;
	text-align: center;
	text-decoration: none;
	font-family:'cinzel',sans-serif;
	font-size:15px;
	font-weight:300;
	display:block;
	border:1px solid rgba(255, 255, 255, 0.5);
	height:auto;
	width:150px;
	padding:10px;
	display: flex;
	text-align: center;
	align-items: center;
	justify-content: center;
	margin-left:1%;
	border-radius: 2px;
	transition: 0.5s ease-in-out;
}
.main .heading .btns a:hover{
	background:#017fb5;
	border:1px solid #017fb5;
}
.main .heading .btns .btn1{
	background:#017fb5;
	border:1px solid #017fb5;
}
.main .heading .btns .btn1:hover{
	background:#017fb5;
	border:1px solid #017fb5 ;
	color:rgba(255, 255, 255, 0.95);
}

.btns .btn1  {
  box-shadow: rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px;
}

.btns .btn2 {
box-shadow: rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px;
}

</style>
