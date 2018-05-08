<template>
    <div class="flex row py-5 color">

        <div class="flex column align-center pl-5 pr-3 py-5" style="width=50%">
            <div>
                <p style="line-height: 38px; font-size: 34px;"><span style="color: #ffffff; text-align:left">Vamos conversar?</span></p>
                <img src="../assets/wave.png" alt="logo" height="16" width="222">
                <div class="flex"></div>
                <div class="flex row py-3">
                <span style="color: #ffffff; font-size: 18px">Muito obrigado por visitar nosso estande, esperamos que tenha gostado ;)</span>
                </div>
                <span style="color: #ffffff; font-size: 18px">Você poderia preencher os campos ao lado? Gostariamos de conhecê-lo melhor!</span>
            </div>
        </div>

        <div class="flex column align-center pr-5 pl-3 py-5" style="width=50%">
            <div class="form-container">
                <el-form ref="form" :model="form">
                    <el-form-item label="" prop="name">
                        <el-input class="elevate-3" placeholder="Qual seu nome?" v-model="form.name"></el-input>
                    </el-form-item>
                    <el-form-item label="" prop="email">
                        <el-input class="elevate-3" placeholder="E seu e-mail?" v-model="form.email"></el-input>
                    </el-form-item>
                    <el-form-item label="" prop="phone">
                        <el-input class="elevate-3" placeholder="DDD+Telefone" v-model="form.phone"></el-input>
                    </el-form-item>
                    <el-form-item label="" prop="role.value">
                        <el-select class="elevate-3" v-model="form.role" style="width: 100%;" placeholder="Você é...">
                            <el-option key="Diretor" label="Diretor" value="Diretor"></el-option>
                            <el-option key="Coordenador" label="Coordenador" value="Coordenador"></el-option>
                            <el-option key="Professor" label="Professor" value="Professor"></el-option>
                            <el-option key="Outros" label="Outros" value="Outros"></el-option>   
                        </el-select>
                    </el-form-item>
                    <el-form-item label="" prop="school">
                        <el-input class="elevate-3" placeholder="Qual o nome da sua escola?" v-model="form.school"></el-input> 
                    </el-form-item>
                    <el-form-item label="" prop="studentsNumber">
                        <el-select class="elevate-3" v-model="form.studentsNumber" style="width: 100%;" placeholder="Quantos alunos tem sua escola?">
                            <el-option key="Até 100 alunos" label="Até 100 alunos" value="Até 100 alunos"></el-option>
                            <el-option key="Até 250 alunos" label="Até 250 alunos" value="Até 250 alunos"></el-option>
                            <el-option key="Até 1000 alunos" label="Até 1000 alunos" value="Até 1000 alunos"></el-option>
                            <el-option key="Mais de 1000 alunos" label="Mais de 1000 alunos" value="Mais de 1000 alunos"></el-option>  
                        </el-select>
                    </el-form-item>
                    <el-form-item label="">
                        <el-button class="elevate-3" @click="$emit('return')">Voltar</el-button>
                        <el-button class="elevate-3" @click="handleSendForm">Iprimir</el-button>
                    </el-form-item>
                </el-form>  
            </div>
        </div>  
    </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Form',
  data () {
    return {
        form:{
            name: '',
            email: '',
            phone: '',
            school: '',
            role: '',
            studentsNumber: ''
        },
        //rules: {
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
       // }
    }
  },

   methods: {
    handleSendForm: function () {
        this.$emit('print', this.form)
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

img{
    max-width: 200px;
    max-height: 16px;
    width: auto;
    height:auto;
}

</style>