document.querySelector('#download_div').click();

var tables = document.querySelectorAll('.pricing-table');

var res = [];

for(var table of tables){
    var plan = table.querySelector('.plan').innerHTML
    if(plan.includes('FREE') || plan.includes('Section')){
        res.push(table.querySelector('a').href);
    }
}

res

