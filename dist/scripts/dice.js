SB.dice = (function(){

    function roll() {
        return Math.floor(Math.random() * 6)+1;
    }

    return {
        roll : roll
    };

})();