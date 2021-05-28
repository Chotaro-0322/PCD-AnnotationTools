var glob = require('glob');
//var {PythonShell} = require('python-shell');

//var bin_pyshell = new PythonShell('pcl.py', {mode: 'binary',
                                             //pythonPath : '/home/chohome/.pyenv/versions/dl/bin/python',
                                             //pythonOptions : ['-u'],
                                             //scriptPath : './'
                                            //});
//
//var pyshell = new PythonShell('pcl.py', {pythonPath : '/home/chohome/.pyenv/versions/dl/bin/python',
                                         //pythonOptions : ['-u'],
                                         //scriptPath : './'
                                        //});
//


function npy_search(){
    //console.log(glob.sync("./npy_data/*.npy"));
    return glob.sync("./npy_data/*.npy");
};

function txt_search(){
    return glob.sync("./velodyne_points/data/*.txt");
}


