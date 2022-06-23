import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import MintView from "../views/MintView.vue";
import NftsView from "../views/NftsView.vue";
import WithdrawView from "../views/WithdrawView.vue";
import ExchangeView from "../views/ExchangeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/mint",
      name: "mint",
      component: MintView,
    },
    {
      path: "/nfts",
      name: "nfts",
      component: NftsView,
    },
    {
      path: "/withdraw",
      name: "withdraw",
      component: WithdrawView,
    },
    {
      path: "/exchange",
      name: "exchange",
      component: ExchangeView,
    },
  ],
});

export default router;
