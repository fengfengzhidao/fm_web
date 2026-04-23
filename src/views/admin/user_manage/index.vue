<script setup lang="ts">
import {reactive, ref} from "vue";
import F_list from "@/components/admin/f_list.vue";
import {
  userAdminInfoUpdateApi,
  userListApi,
  type userListType,
  userRegisterApi,
} from "@/api/user_api";
import {Message} from "@arco-design/web-vue";
import {dateTemFormat} from "@/utils/date";

const columns = [
  {title: "ID", dataIndex: 'id'},
  {title: "用户名", dataIndex: 'username'},
  {title: "昵称", dataIndex: 'nickname'},
  {title: "头像", slotName: 'avatar'},
  {title: "角色", slotName: 'role'},
  {title: "登录IP", dataIndex: 'ip'},
  {title: "地址", dataIndex: 'addr'},
  {title: "时间", slotName: 'createdAt'},
  {title: "操作", slotName: 'action'},
]

const fListRef = ref<InstanceType<typeof F_list>>()
const addVisible = ref(false)
const editVisible = ref(false)
const addFormRef = ref()
const editFormRef = ref()

const addForm = reactive({
  username: "",
  password: "",
  rePassword: "",
})

const editForm = reactive({
  userID: 0,
  avatar: "",
  nickname: "",
  roleID: 2,
})

function openAdd() {
  addVisible.value = true
}

function openEdit(record: userListType) {
  editForm.userID = record.id
  editForm.avatar = record.avatar
  editForm.nickname = record.nickname
  editForm.roleID = record.roleID
  editVisible.value = true
}

async function createUser(done: (closed: boolean) => void) {
  const error = await addFormRef.value.validate()
  if (error) {
    done(false)
    return
  }
  const res = await userRegisterApi(addForm)
  if (res.code) {
    Message.error(res.msg)
    done(false)
    return
  }
  Message.success(res.msg)
  addFormRef.value.resetFields()
  fListRef.value?.getList()
  done(true)
}

async function updateUser(done: (closed: boolean) => void) {
  const error = await editFormRef.value.validate()
  if (error) {
    done(false)
    return
  }
  const res = await userAdminInfoUpdateApi(editForm)
  if (res.code) {
    Message.error(res.msg)
    done(false)
    return
  }
  Message.success(res.msg)
  fListRef.value?.getList()
  done(true)
}

function roleName(roleID: number) {
  return roleID === 1 ? "管理员" : "用户"
}

</script>

<template>
  <div>
    <f_list
        ref="fListRef"
        :url="userListApi"
        :columns="columns"
        add-label="创建用户"
        edit-label="编辑用户"
        @add="openAdd"
        @edit="openEdit">
      <template #avatar="{record}:{record: userListType}">
        <a-avatar :image-url="record.avatar"></a-avatar>
      </template>
      <template #role="{record}:{record: userListType}">
        <a-tag :color="record.roleID === 1 ? 'red' : 'blue'">{{ roleName(record.roleID) }}</a-tag>
      </template>
      <template #createdAt="{record}:{record: userListType}">
        {{ dateTemFormat(record.createdAt) }}
      </template>
    </f_list>

    <a-modal v-model:visible="addVisible" title="创建用户" :on-before-ok="createUser">
      <a-form ref="addFormRef" :model="addForm" auto-label-width>
        <a-form-item field="username" label="用户名" :rules="[{required: true, message: '请输入用户名'}]">
          <a-input v-model="addForm.username" placeholder="用户名"></a-input>
        </a-form-item>
        <a-form-item field="password" label="密码" :rules="[{required: true, message: '请输入密码'}]">
          <a-input-password v-model="addForm.password" placeholder="密码"></a-input-password>
        </a-form-item>
        <a-form-item field="rePassword" label="确认密码" :rules="[{required: true, message: '请确认密码'}]">
          <a-input-password v-model="addForm.rePassword" placeholder="确认密码"></a-input-password>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="editVisible" title="编辑用户" :on-before-ok="updateUser">
      <a-form ref="editFormRef" :model="editForm" auto-label-width>
        <a-form-item field="avatar" label="头像" :rules="[{required: true, message: '请输入头像地址'}]">
          <a-input v-model="editForm.avatar" placeholder="头像地址"></a-input>
        </a-form-item>
        <a-form-item field="nickname" label="昵称" :rules="[{required: true, message: '请输入昵称'}]">
          <a-input v-model="editForm.nickname" placeholder="昵称"></a-input>
        </a-form-item>
        <a-form-item field="roleID" label="角色">
          <a-radio-group v-model="editForm.roleID" :options="[
            {label: '管理员', value: 1},
            {label: '用户', value: 2},
          ]"></a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
