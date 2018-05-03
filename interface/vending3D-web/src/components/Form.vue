<template>

    <div class="flex column align-center px-5 py-5 color">
        <div class="form-container">
            <el-form ref="form" :model="form" :rules="rules">
                <el-form-item label="" prop="name">
                    <el-input placeholder="Qual seu nome?" v-model="form.name"></el-input>
                </el-form-item>
                <el-form-item label="" prop="email">
                    <el-input placeholder="E seu e-mail?" v-model="form.email"></el-input>
                </el-form-item>
                <el-form-item label="" prop="phone">
                    <el-input placeholder="DDD+Telefone" v-model="form.phone"></el-input>
                </el-form-item>
                <el-form-item label="" prop="roleOptions.value">
                    <el-select v-model="form.roleOptions.value" style="width: 100%;" placeholder="Você é...">
                        <el-option
                        v-for="item in form.roleOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="" prop="school">
                    <el-input placeholder="Qual o nome da sua escola?" v-model="form.school"></el-input> 
                </el-form-item>
                <el-form-item label="" prop="studentsNumberOptions">
                    <el-select v-model="form.studentsNumberOptions.value" style="width: 100%;" placeholder="Quantos alunos tem sua escola?">
                        <el-option
                        v-for="item in form.studentsNumberOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="">
                    <el-button @click="$emit('return')">Voltar</el-button>
                    <el-button @click="submitForm('form')">Iprimir</el-button>
                </el-form-item>
                <!-- <el-form-item label="">
                
                </el-form-item> -->
            </el-form>  
        </div>
    </div>

</template>

<script>

export default {
  name: 'Form',
  data () {
    return {
        form:{
            name: '',
            email: '',
            phone: '',
            school: '',
            roleOptions: [{
            value: 'Diretor',
            label: 'Diretor'
            },
            {
                value: 'Coordenador',
                label: 'Coordenador'
            },
            {
                value: 'Professor',
                label: 'Professor'
            },
            {
                value: 'Outros',
                label: 'Outros'
            }],
            studentsNumberOptions: [{
                value: '1',
                label: 'Até 100 alunos'
            },
            {
                value: '2',
                label: 'Até 250 alunos'
            },
            {
                value: "3",
                label: 'Até 1000 alunos'
            },
            {
                value: "4",
                label: "Mais de 1000 alunos"
            }]
        },
        rules: {
            // name: [
            //     { required: true, message: 'Por favor insira seu nome', trigger: 'blur' }
            // ],
            // email: [
            //     { required: true, message: 'Por favor insira seu email', trigger: 'blur' }
            // ],
            // phone: [
            //     { required: true, message: 'Por favor insira um telefone para contato', trigger: 'blur' }
            // ],
            // school: [
            //     { required: true, message: 'Por favor nos diga o nome da escola que você veio representa', trigger: 'blur' }
            // ],
            // roleOptions: [
            //     { required: true, message: 'Por favor nos diga o que você faz', trigger: 'blur' }
            // ],
            // studentsNumberOptions: [
            //     { required: true, message: 'Precisamos de uma estimativa de quantos alunos tem na sua escola', trigger: 'change' }
            // ],
        }
    }
  },

   methods: {
      submitForm(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {
            //alert('submit!')
            this.$emit('print')
          } else {
            console.log('error submit!!')
            return false
          }
        });
      },
   }
}
</script>

<style scoped>

.color {
    background-color: #4AAFDD;
}

.form-container {
    display: inline;
    width: 400px;
}

.el-select {
  width: 300px;
}

</style>