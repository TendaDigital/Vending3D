<template>

  <div>
      
            <el-form ref="form" :model="form" label-width="120px">
                <el-form-item label="">
                    <el-input placeholder="Qual seu nome?" v-model="form.name"></el-input>
                </el-form-item>
                <el-form-item label="">
                    <el-input placeholder="E seu e-mail?" v-model="form.email"></el-input>
                </el-form-item>
                <el-form-item label="">
                    <el-input placeholder="DDD+Telefone" v-model="form.phone"></el-input>
                </el-form-item>
                <el-form-item label="">
                    <el-select v-model="form.roleOptions.value" placeholder="Você é...">
                        <el-option
                        v-for="item in form.roleOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="">
                <el-input placeholder="Qual o nome da sua escola?" v-model="form.school"></el-input> 
                </el-form-item>
                <el-form-item label="">
                    <el-select v-model="form.studentsNumberOptions.value" placeholder="Quantos alunos tem sua escola?">
                        <el-option
                        v-for="item in form.studentsNumberOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-form>
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
        }
    }
  }
}
</script>

<style scoped>

  .el-row {
    margin-top: 100px;
    }
</style>