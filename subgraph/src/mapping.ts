import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import { UsernameRegistered, UsernameReleased } from "../generated/UsernameRegistry/UsernameRegistry"
import { TabCreated, TabSettled, MemberPaid } from "../generated/SplitManager/SplitManager"
import { User, Tab, TabPayment } from "../generated/schema"

export function handleUsernameRegistered(event: UsernameRegistered): void {
  let userId = event.params.wallet.toHexString()
  let user = User.load(userId)
  if (!user) {
    user = new User(userId)
    user.createdAt = event.block.timestamp
  }
  // Store the hex representation of the indexed string hash
  user.username = event.params.username.toHexString()
  user.save()
}

export function handleUsernameReleased(event: UsernameReleased): void {
  let userId = event.params.wallet.toHexString()
  let user = User.load(userId)
  if (user) {
    user.username = ""
    user.save()
  }
}

export function handleTabCreated(event: TabCreated): void {
  let tabId = event.params.tabId.toHexString()
  let tab = new Tab(tabId)
  tab.creator = event.params.creator
  tab.title = event.params.title
  tab.settled = false
  tab.paidCount = BigInt.fromI32(0)
  tab.createdAt = event.block.timestamp
  tab.members = []
  tab.shares = []
  tab.save()
}

export function handleTabSettled(event: TabSettled): void {
  let tabId = event.params.tabId.toHexString()
  let tab = Tab.load(tabId)
  if (tab) {
    tab.settled = true
    tab.save()
  }
}

export function handleMemberPaid(event: MemberPaid): void {
  let tabId = event.params.tabId.toHexString()
  let tab = Tab.load(tabId)
  if (tab) {
    tab.paidCount = tab.paidCount.plus(BigInt.fromI32(1))
    tab.save()

    let paymentId = tabId + "-" + event.params.member.toHexString()
    let payment = new TabPayment(paymentId)
    payment.tab = tabId
    payment.member = event.params.member
    payment.amount = event.params.amount
    payment.timestamp = event.block.timestamp
    payment.save()
  }
}
