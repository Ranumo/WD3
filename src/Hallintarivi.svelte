<script>
  import Login from './Login.svelte';
  import AddEvent from './AddEvent.svelte';

  let tietokanta = [];

  let otsikko = '';
  let alkuAika;
  let loppuAika;
  let pv;
  let loppupv;
  let lisatiedot;

  let showAddWindow = false;

  function showWindow() {
    showAddWindow = true;
  }
  function submitWindow() {
    tietokanta.push(tapahtumaTiedot);
    console.log(tapahtumaTiedot);
    showAddWindow = false;
  }
  function hideWindow() {
    showAddWindow = false;
  }

  $: tapahtumaTiedot = {
    otsikko: otsikko,
    alkuAika: alkuAika,
    loppuAika: loppuAika,
    pv: pv,
    loppupv: loppupv,
    lisatiedot: lisatiedot,
  };
  var Kuukaudet = [ "Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu", "Toukokuu", "Kesäkuu", 
           "Heinäkuu", "Elokuu", "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu" ];
           let day = new Date()
  day.getDate()
</script>

<main>
  <body>
    <div id="titlerivi">
      <img
        src="https://www.adaptivewfs.com/wp-content/uploads/2020/07/logo-placeholder-image-300x300.png.webp"
        alt="Placeholder logo"
      />
      <div id="otsikko">
        <h1>Kalenteri</h1>
      </div>

      <h2>Viikko</h2>
      <h2>Kuukausi</h2>
      <Login />
    </div>

    <div id="hallintarivi">
      <div id="viikkonavi">
        <div class="napv">
          <h3>&#60 Edellinen viikko</h3>
        </div>
        <div class="napv">
          <h3>Seuraava viikko &#62</h3>
        </div>
      </div>
      <h4>{Kuukaudet[day.getMonth()]}</h4>
      <button id="lisays" on:click={showWindow}>+Lisää tapahtuma</button>
    </div>
    {#if showAddWindow}
      <AddEvent
        bind:otsikko
        bind:alkuAika
        bind:loppuAika
        bind:pv
        bind:loppupv
        bind:lisatiedot
        on:tallenna={submitWindow}
        on:peruuta={hideWindow}
      />
    {/if}
  </body>
</main>

<style>
  img {
    width: 100px;
  }
  #titlerivi {
    width: 1275px;
    height: 50px;
    margin: 5px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
  }

  #hallintarivi {
    width: 1275px;
    height: 50px;
    margin: 5px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    padding: 5px;
    justify-content: space-between;
  }

  #otsikko {
    height: 100%;
    width: 300px;
    padding: 10px;
    padding-left: 20px;
    margin: 5px;
    display: flex;
    align-items: center;
    background-color: rgb(146, 219, 255);
    border: 1px solid rgb(0, 170, 255);
  }

  H1 {
    font-size: 50px;
    font-family: 'Times New Roman', Times, serif;

    color: rgb(235, 244, 255);
  }

  h2 {
    border: 1px solid rgb(0, 170, 255);
    background-color: rgb(146, 219, 255);
    padding: 10px;
    color: rgb(235, 244, 255);
  }

  h3 {
    border: 1px solid rgb(0, 170, 255);
    background-color: rgb(146, 219, 255);
    padding: 10px;
    color: rgb(235, 244, 255);
  }

  h4 {
    font-size: 50px;
    font-family: 'Times New Roman', Times, serif;
    color: rgb(72, 72, 72);
  }

  #lisays {
    border: 1px solid rgb(0, 170, 255);
    background-color: rgb(146, 219, 255);
    padding: 10px;
    color: rgb(235, 244, 255);
  }

  #viikkonavi {
    display: flex;
    flex-direction: row;
    margin: 10px;
  }
  .napv {
    margin: 5px;
  }
</style>
