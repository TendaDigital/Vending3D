<template>
  <div style="width: 100%; height: 100%">
    <v-icon class="cancel-button" @click="$emit('cancel')">close</v-icon>
    <div
        :data-tf-widget="formId"
        data-tf-on-ready="ready"
        data-tf-on-submit="submit"
        data-tf-hide-headers
        data-tf-hide-footer
        data-tf-opacity="1"
        id="form"
        style="width: 100%; height: 100%"
    ></div>
  </div>
</template>

<script>
import axios from 'axios'
import { createWidget } from '@typeform/embed'
import '@typeform/embed/build/css/widget.css'

export default {
  props: {
    formId: {
      required: true,
      type: String
    }
  },
  methods: {
    async getOwnerInfo (responseId) {
      let response
      try {
        response = await axios.get(`/task/owner-info/${responseId}/`)
      } catch (error) {
        console.log(error)
      }
      if (response.data.hasOwnProperty('answers')) {
        const ownerData = {
          name: response.data.answers[0].text,
          score: response.data.calculated.score
        }
        return (ownerData)
      }
      return 'Visitante'
    }
  },

  mounted () {
    createWidget(this.formId, {
      container: document.querySelector('#form'),
      onSubmit: () => {
        this.$emit('next')
      }
      // async (event) => {
      //   let owner
      //   try {
      //     owner = await this.getOwnerInfo(event.response_id)
      //   } catch (error) {
      //     console.log(error)
      //   }
      //   const ownerName = owner.score >= 80 ? owner.name + ' 😎' : owner.name
      //   setTimeout(() => {
      //     this.$emit('print', ownerName)
      //   }, 3000)
      // }
    })
  }
}
</script>

<style>

.cancel-button {
  position: absolute;
  z-index: 200;
  top: 5%;
  right: 5%;
}

.cancel-button:hover {
  cursor: pointer;
}

</style>
